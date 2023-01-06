import { Util } from "./util";
import { AlertMessage, AlertTitle, Byte, FileName, Timezone } from "./types";
import { UI } from "./ui";
import { User } from "./model/user";
import { FileInfo } from "./model/file-info";

// [前提] Google Apps Script は実行時間 6 分での絶対の打ち切りが存在する。
// [実装方針] いつ打ち切られても、再実行すれば処理が完了できるものを目指す。そのため実行効率が犠牲になるのは妥協する。
// [妥協点の例] スプレッドシートへのデータ挿入は全件一括が最もパフォーマンスが良いが、処理打ち切りで処理中データが喪失するのを回避するため逐次的に挿入する。

const DRIVE_URL_STARTS_WITH = "https://drive.google.com/drive/";
const EXTRACT_ID_REGEX = /[-\w]{25,}/; // see https://stackoverflow.com/questions/16840038/easiest-way-to-get-file-id-from-url-on-google-apps-script
const SHEET_HEADER = [
  "フォルダ番号",
  "ハッシュ値(sha1)",
  "ファイル名",
  "最終更新日",
  "認識文字列"
];
const NUM_INSERT_ROW_THRESHOLD = 10;
const NAMED_RANGE_NAME = "textract_results";
const OUTPUT_SHEET_NAME = "textract";
const ADDON_TITLE = "Simple Textract";

function onOpen(e): void {
  Logger.log(e);
  const user = new User();
  if (e.timeZone !== undefined) {
    user.timezone = e.timeZone.id as Timezone;
  }
  Logger.log(`current setting timezone is ${user.timezone}`);
  UI.init();
}

function main(): void {
  const folderUrl = UI.startPrompt(); // TODO キャンセルボタンを押した際の処理とURLからの場合が同じ扱いになっているのでなんとかしたい
  Logger.log(`user input: ${folderUrl}`);
  if (folderUrl === "") {
    const title = "正常終了。" as AlertTitle;
    const message = "実行はキャンセルされました。" as AlertMessage;
    UI.alert(message, title);
    return;
  }

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

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let namedRange = spreadsheet
    .getNamedRanges()
    .filter((r) => r.getName() === NAMED_RANGE_NAME)
    .shift();

  if (namedRange === undefined) {
    namedRange = initialize(spreadsheet);
  }

  realMain(folder, namedRange);
}

// テスト実行しやすくするため, ユーザーとのインタラクションを切り離した
export function realMain(
  folder: GoogleAppsScript.Drive.Folder,
  namedRange: GoogleAppsScript.Spreadsheet.NamedRange
): void {
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

    const data = textract(file);
    sheetData.push([
      today,
      data.hash,
      data.fileName,
      data.lastUpdated,
      data.text
    ]);

    // TODO タイムアウト対策のため、実行途中でも定期的に書き出しはさせたい, もっと良い方法がないか考える
    if (sheetData.length % NUM_INSERT_ROW_THRESHOLD === 0) {
      appendData(namedRange, sheetData);
    }
    file.moveTo(doneFolder); // 処理済み画像ファイルを移動
  }
  appendData(namedRange, sheetData); // 最後にかならず書き出し。
}

function textract(imageFile: GoogleAppsScript.Drive.File): FileInfo {
  // 画像をGoogleDocへ変換, { convert:true } が肝, Drive API V2 を利用している
  const blob = imageFile.getBlob();

  if (Drive === undefined || Drive.Files === undefined) {
    throw new Error("Drive API v2 を有効化してください。");
  }

  const response = Drive.Files.insert({ title: blob.getName() }, blob, {
    ocr: true
  });

  if (response === undefined || response.id === undefined) {
    throw new Error(`response is ${response}`);
  }

  const doc = DocumentApp.openById(response.id); // Drive API のレスポンスから id を取り出し DocumentApp のインスタンス取得

  // 作業ファイルは削除, 必要なデータは doc インスタンスに含まれているので以後 docFile を利用することはない
  const docFile = DriveApp.getFileById(doc.getId());
  DriveApp.removeFile(docFile);

  const fileName = imageFile.getName() as FileName;
  const sha1hash = Util.computeSha1HashHexString(
    imageFile.getBlob().getBytes() as Byte[]
  );
  // Logger.log(hash);
  const lastUpdated = Util.rfc3339datetime(
    imageFile.getLastUpdated(),
    new User().timezone
  );
  const text = doc.getBody().getText();
  return new FileInfo(fileName, sha1hash, lastUpdated, text);
}

function initialize(
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet
): GoogleAppsScript.Spreadsheet.NamedRange {
  const sheet = spreadsheet.insertSheet(1);
  sheet.setName(OUTPUT_SHEET_NAME);

  // 結果出力用の名前付き範囲を定義
  const range = sheet.getRange(1, 1, 1, SHEET_HEADER.length);
  range.setValues([SHEET_HEADER]);
  spreadsheet.setNamedRange(NAMED_RANGE_NAME, range);
  const namedRange = spreadsheet
    .getNamedRanges()
    .filter((r) => r.getName() === NAMED_RANGE_NAME)
    .shift();

  if (namedRange === undefined) {
    throw Error(`namedRange is ${namedRange}`);
  }
  return namedRange;
}

function appendData(
  namedRange: GoogleAppsScript.Spreadsheet.NamedRange,
  data: string[][]
): void {
  const range = namedRange.getRange();
  const currentValues = range.getValues();

  const numRows = range.getNumRows() + data.length;
  const newRange = range.offset(0, 0, numRows, SHEET_HEADER.length);
  Logger.log(
    `currentValues rows: ${currentValues.length}, cols: ${currentValues[0].length}`
  );
  Logger.log(
    `newRange rows: ${newRange.getNumRows()}, cols: ${newRange.getNumColumns()}`
  );
  Logger.log(
    `newValues rows: ${currentValues.concat(data).length}, cols: ${
      currentValues.concat(data)[0].length
    }, and data is ${currentValues.concat(data)}`
  );
  namedRange
    .setRange(newRange)
    .getRange()
    .setValues(currentValues.concat(data));
}
