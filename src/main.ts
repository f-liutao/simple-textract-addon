import {UI} from "./ui";
import {User} from "./model/user";
import {SheetService} from "./service/sheet.service";
import {TextractService} from "./service/textract.service";
import {eventTypes, FileName, FolderId} from "./types";
import {Util} from "./util";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onOpen(e): void {
    UI.init();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function main(folderId: FolderId): void {
    // GCP のプロジェクト側で Google Drive API を有効化しないと、getFolderById でエラーがでる
    // https://qiita.com/Cyber_Hacnosuke/items/9b76fbe95da54694d758
    const folder = DriveApp.getFolderById(folderId);
    Logger.log(`target folder: ${folder}`);

    // GAS だと FileIterator で一つずつ数えるハメになるので、Drive API v2 を利用する
    const sheetService = new SheetService();

    const doneFolder = DriveApp.createFolder(Utilities.formatDate(
        new Date(),
        new User().timezone,
        "yyyyMMdd-HHmm"
    ));
    doneFolder.moveTo(folder); // 作業対象フォルダ配下へ移動

    // 対象フォルダ内のファイルを一つずつ処理
    const files = folder.getFiles();
    while (files.hasNext()) {
        const file = files.next();
        const fileName = file.getName() as FileName;
        sheetService.outLog({type: eventTypes[0], target: fileName});
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
        sheetService.outLog({type: eventTypes[1], target: fileName});
        const result = TextractService.textract(file);
        sheetService.outLog({type: eventTypes[2], target: fileName});
        const now = Util.rfc3339datetime(
            new Date(),
            new User().timezone
        );
        sheetService.appendResult(Object.assign({now, folderId}, result));
        file.moveTo(doneFolder); // 処理済み画像ファイルを移動
        sheetService.outLog({type: eventTypes[3], target: fileName});
    }
}

/* eslint-disable @typescript-eslint/no-unused-vars */
function getOAuthToken() {
    try {
        DriveApp.getRootFolder();
        return ScriptApp.getOAuthToken();
    } catch (e) {
        // TODO Handle exception
        Logger.log("Failed with error: %s", e.error);
    }
}

/* eslint-disable @typescript-eslint/no-unused-vars */
function getUserLocale(){
    try{
        return Session.getActiveUserLocale();
    }catch (e){
        // TODO Handle exception
        Logger.log("Failed with error: %s", e.error);
    }
}

/* eslint-disable @typescript-eslint/no-unused-vars */
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
