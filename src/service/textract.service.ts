import { FileInfo } from "../model/file-info";
import { Byte, FileName } from "../types";
import { Util } from "../util";
import { User } from "../model/user";

export class TextractService {
  static textract(imageFile: GoogleAppsScript.Drive.File): FileInfo {
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
}
