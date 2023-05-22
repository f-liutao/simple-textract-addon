const OUTPUT_SHEET_NAME = "textract";
const NAMED_RANGE_NAME = "textract_results";
const SHEET_HEADER = [
    "フォルダ番号",
    "ハッシュ値(sha1)",
    "ファイル名",
    "最終更新日",
    "認識文字列"
];
export class SheetService {
    constructor() {
        this.spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    }
    get named_range() {
        const nullableNamedRange = this.spreadsheet
            .getNamedRanges()
            .filter((r) => r.getName() === NAMED_RANGE_NAME)
            .shift();
        return nullableNamedRange;
    }
    initialize() {
        const sheet = this.spreadsheet.insertSheet(1);
        sheet.setName(OUTPUT_SHEET_NAME);
        // 結果出力用の名前付き範囲を定義
        const range = sheet.getRange(1, 1, 1, SHEET_HEADER.length);
        range.setValues([SHEET_HEADER]);
        this.spreadsheet.setNamedRange(NAMED_RANGE_NAME, range);
        const namedRange = this.spreadsheet
            .getNamedRanges()
            .filter((r) => r.getName() === NAMED_RANGE_NAME)
            .shift();
        if (namedRange === undefined) {
            throw Error(`namedRange is ${namedRange}`);
        }
        return namedRange;
    }
    appendData(namedRange, data) {
        const range = namedRange.getRange();
        const currentValues = range.getValues();
        const numRows = range.getNumRows() + data.length;
        const newRange = range.offset(0, 0, numRows, SHEET_HEADER.length);
        Logger.log(`currentValues rows: ${currentValues.length}, cols: ${currentValues[0].length}`);
        Logger.log(`newRange rows: ${newRange.getNumRows()}, cols: ${newRange.getNumColumns()}`);
        Logger.log(`newValues rows: ${currentValues.concat(data).length}, cols: ${currentValues.concat(data)[0].length}, and data is ${currentValues.concat(data)}`);
        namedRange
            .setRange(newRange)
            .getRange()
            .setValues(currentValues.concat(data));
    }
}
