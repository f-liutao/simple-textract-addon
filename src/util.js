// see https://stackoverflow.com/questions/34309988/byte-array-to-hex-string-conversion-in-javascript
export class Util {
    static toHexString(bytes) {
        return Array.from(bytes, (byte) => {
            return ("0" + (byte & 0xff).toString(16)).slice(-2);
        }).join("");
    }
    static computeSha1HashHexString(bytes) {
        return Util.toHexString(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1, bytes));
    }
    static rfc3339datetime(date, tz) {
        const rfc3339format = "yyyy-MM-dd'T'HH:mm:ssXXX";
        return Utilities.formatDate(date, tz, rfc3339format);
    }
}
