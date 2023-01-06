import {
  Byte,
  HexString,
  RFC3339Datetime,
  Sha1HashHexString,
  Timezone
} from "./types";

// see https://stackoverflow.com/questions/34309988/byte-array-to-hex-string-conversion-in-javascript
export class Util {
  static toHexString(bytes: Byte[]): HexString {
    return Array.from(bytes, (byte) => {
      return ("0" + (byte & 0xff).toString(16)).slice(-2);
    }).join("") as HexString;
  }

  static computeSha1HashHexString(bytes: Byte[]): Sha1HashHexString {
    return Util.toHexString(
      Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1, bytes) as Byte[]
    ) as Sha1HashHexString;
  }

  static rfc3339datetime(
    date: GoogleAppsScript.Base.Date,
    tz: Timezone
  ): RFC3339Datetime {
    const rfc3339format = "yyyy-MM-dd'T'HH:mm:ssXXX";
    return Utilities.formatDate(date, tz, rfc3339format) as RFC3339Datetime;
  }
}
