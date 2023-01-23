import {UI} from "./ui";
import {User} from "./model/user";
import {SheetService} from "./service/sheet.service";
import {TextractService} from "./service/textract.service";

// [前提] Google Apps Script は実行時間 6 分での絶対の打ち切りが存在する。
// [実装方針] いつ打ち切られても、再実行すれば処理が完了できるものを目指す。そのため実行効率が犠牲になるのは妥協する。
// [妥協点の例] スプレッドシートへのデータ挿入は全件一括が最もパフォーマンスが良いが、処理打ち切りで処理中データが喪失するのを回避するため逐次的に挿入する。
const NUM_INSERT_ROW_THRESHOLD = 10;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onOpen(e): void {
    UI.init();
}

// TODO main 関数が起動のエンドポイントではなくなるので、それに合わせて書き換える
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function main(folderId: string): void {
    // GCP のプロジェクト側で Google Drive API を有効化しないと、getFolderById でエラーがでる
    // https://qiita.com/Cyber_Hacnosuke/items/9b76fbe95da54694d758
    const folder = DriveApp.getFolderById(folderId);
    Logger.log(`target folder: ${folder}`);

    // TODO 画像が多すぎる場合の警告も実装が必要
    // GAS だと FileIterator で一つずつ数えるハメになるので、Drive API v2 を利用する

    const sheetService = new SheetService();
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
/**
 * Gets the user's OAuth 2.0 access token so that it can be passed to Picker.
 * This technique keeps Picker from needing to show its own authorization
 * dialog, but is only possible if the OAuth scope that Picker needs is
 * available in Apps Script. In this case, the function includes an unused call
 * to a DriveApp method to ensure that Apps Script requests access to all files
 * in the user's Drive.
 *
 * @return {string} The user's OAuth 2.0 access token.
 */
function getOAuthToken() {
    try {
        DriveApp.getRootFolder();
        return ScriptApp.getOAuthToken();
    } catch (e) {
        // TODO Handle exception
        Logger.log("Failed with error: %s", e.error);
    }
}

function getUserLocale(){
    try{
        return Session.getActiveUserLocale();
    }catch (e){
        // TODO Handle exception
        Logger.log("Failed with error: %s", e.error);
    }
}

function getFiles(folderId){
    try{
        let count = 0;
        const files = DriveApp.getFolderById(folderId).getFiles();
        while (files.hasNext()) {
            count++;
        }
        return count;
    } catch (e){
        Logger.log("Failed with error: %s", e.error);
    }
}
