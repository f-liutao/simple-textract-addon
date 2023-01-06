import { FileName, RFC3339Datetime, Sha1HashHexString } from "../types";

export class FileInfo {
  fileName: FileName;
  hash: Sha1HashHexString;
  lastUpdated: RFC3339Datetime;
  text: string;

  constructor(
    fileName: FileName,
    hash: Sha1HashHexString,
    lastUpdated: RFC3339Datetime,
    text: string
  ) {
    this.fileName = fileName;
    this.hash = hash;
    this.lastUpdated = lastUpdated;
    this.text = text;
  }
}
