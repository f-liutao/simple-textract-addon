import {FileInfo} from "../model/file-info";
import {FolderId, EventType, RFC3339Datetime, FileName} from "../types";
import {Util} from "../util";
import {User} from "../model/user";

const OUTPUT_SHEET_NAME = "textract";
const LOG_SHEET_NAME = "textract-log";
const OUTPUT_SHEET_HEADER = [
    "フォルダ番号",
    "ハッシュ値(sha1)",
    "ファイル名",
    "最終更新日",
    "認識文字列"
];
const LOG_SHEET_HEADER = [
    "日時",
    "操作",
    "対象ファイル名"
];



interface LogEvent {
    type: EventType;
    target: FileName;
}

interface Result extends FileInfo{
    now: RFC3339Datetime;
    folderId: FolderId;
}

export class SheetService {
    spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet;
    outputSheet: GoogleAppsScript.Spreadsheet.Sheet;
    logSheet: GoogleAppsScript.Spreadsheet.Sheet;

    constructor() {
        this.spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        this.outputSheet = this.spreadsheet.getSheetByName(OUTPUT_SHEET_NAME) ?? this.createSheet(OUTPUT_SHEET_NAME, OUTPUT_SHEET_HEADER);
        this.logSheet = this.spreadsheet.getSheetByName(LOG_SHEET_NAME) ?? this.createSheet(LOG_SHEET_NAME, LOG_SHEET_HEADER);
    }

    private createSheet(sheetName: string, header: string[]): GoogleAppsScript.Spreadsheet.Sheet {
        const sheet = this.spreadsheet.insertSheet(1);
        sheet.setName(sheetName);
        // 結果出力用の名前付き範囲を定義
        sheet.getRange(1, 1, 1, header.length).setValues([header]);
        return sheet;
    }

    outLog(event: LogEvent){
        this.logSheet.appendRow([Util.rfc3339datetime(new Date(),
            new User().timezone), event["type"], event["target"]]);
    }

    appendResult(result: Result){
        this.outputSheet.appendRow([result["folderNum"], result["fileHash"], result["fileName"], result["updatedAt"], result["recognizedText"]]);
    }
}
