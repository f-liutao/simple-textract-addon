import {AlertMessage, AlertTitle, Timezone} from "./types";
import {UI} from "./ui";
import {User} from "./model/user";
import {SheetService} from "./service/sheet.service";
import {TextractService} from "./service/textract.service";

// [前提] Google Apps Script は実行時間 6 分での絶対の打ち切りが存在する。
// [実装方針] いつ打ち切られても、再実行すれば処理が完了できるものを目指す。そのため実行効率が犠牲になるのは妥協する。
// [妥協点の例] スプレッドシートへのデータ挿入は全件一括が最もパフォーマンスが良いが、処理打ち切りで処理中データが喪失するのを回避するため逐次的に挿入する。
const DRIVE_URL_STARTS_WITH = "https://drive.google.com/folders"; // picker UI を利用して ID を取る方式のほうが手堅い (my-drive などを考えなくて良い, ただし Google Workspace の共有フォルダがどうなるかはわからない）
const EXTRACT_ID_REGEX = /[-\w]{25,}/; // see https://stackoverflow.com/questions/16840038/easiest-way-to-get-file-id-from-url-on-google-apps-script
const NUM_INSERT_ROW_THRESHOLD = 10;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onOpen(e): void {
    Logger.log(e);
    const user = new User();
    if (e.timeZone !== undefined) {
        user.timezone = e.timeZone.id as Timezone;
    }
    Logger.log(`current setting timezone is ${user.timezone}`);
    UI.init();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function main(): void {
    const folderUrl = UI.startPrompt(); // TODO キャンセルボタンを押した際の処理とURLからの場合が同じ扱いになっているのでなんとかしたい
    Logger.log(`user input: ${folderUrl}`);
    if (folderUrl === "") {
        const title = "正常終了。" as AlertTitle;
        const message = "実行はキャンセルされました。" as AlertMessage;
        UI.alert(message, title);
        return;
    }

    // TODO Picker UI を利用するならこれは不要, 要はフォルダの ID が取れれば良い
    if (!folderUrl.startsWith(DRIVE_URL_STARTS_WITH)) {
        const message =
            `URLを確認してください。Google Drive のフォルダの URL は ${DRIVE_URL_STARTS_WITH}... という書式です。` as AlertMessage;
        UI.alert(message);
        return;
    }

    const matches = folderUrl.match(EXTRACT_ID_REGEX);
    Logger.log(`matches by folderId extraction regex: ${matches}`);
    if (!matches || matches.length < 1) {
        const message =
            "URLを確認してください。URL中のfolders/より後の文字列が切れていないか確認してください。" as AlertMessage;
        UI.alert(message);
        return;
    }

    const folderId = matches[0];

    // GCP のプロジェクト側で Google Drive API を有効化しないと、getFolderById でエラーがでる
    // https://qiita.com/Cyber_Hacnosuke/items/9b76fbe95da54694d758
    const folder = DriveApp.getFolderById(folderId);
    Logger.log(`target folder: ${folder}`);

    // TODO 画像が多すぎる場合の警告も実装が必要
    // GAS だと FileIterator で一つずつ数えるハメになるので、Drive API v2 を利用する


    this.realMain(folder, new SheetService());
}

// TODO だんだん、分けた意味がなくなってきている。再度リファクタリングが必要。テスタビリティの維持が最重要。
function realMain(
    folder: GoogleAppsScript.Drive.Folder,
    // namedRange: GoogleAppsScript.Spreadsheet.NamedRange
    sheetService: SheetService
): void {
    const namedRange = sheetService.named_range ?? sheetService.initialize();
    const today = Utilities.formatDate(
        new Date(),
        new User().timezone,
        "yyyyMMdd-HHmm"
    );
    const doneFolder = DriveApp.createFolder(today);
    doneFolder.moveTo(folder); // 作業対象フォルダ配下へ移動

    const sheetData: Array<string[]> = new Array<string[]>();

    // 対象フォルダ内のファイルを一つずつ処理
    const files = folder.getFiles();
    while (files.hasNext()) {
        const file = files.next();
        const mimeType = file.getMimeType();

        // see https://developers.google.com/drive/api/v2/reference/files/insert
        // 'Whether to attempt OCR on .jpg, .png, .gif, or .pdf uploads. (Default: false) '
        if (
            mimeType !== "image/png" &&
            mimeType !== "image/jpeg" &&
            mimeType !== "image/gif" &&
            mimeType !== "application/pdf"
        ) {
            continue; // 変換不能なファイル形式は飛ばす
        }

        const data = TextractService.textract(file);
        sheetData.push([
            today,
            data.hash,
            data.fileName,
            data.lastUpdated,
            data.text
        ]);
        // TODO タイムアウト対策のため、実行途中でも定期的に書き出しはさせたい, もっと良い方法がないか考える
        if (sheetData.length % NUM_INSERT_ROW_THRESHOLD === 0) {
            sheetService.appendData(namedRange, sheetData);
        }
        file.moveTo(doneFolder); // 処理済み画像ファイルを移動
    }
    sheetService.appendData(namedRange, sheetData); // 最後にかならず書き出し。
}
