import { describe, expect, test } from "@jest/globals";
import { Util } from "./util";
import { Byte, HexString } from "./types";

describe("test for util.ts", () => {
  test("toHexString", () => {
    const hexString = "09020e0a" as HexString;
    const byteArray = [9, 2, 14, 10] as Byte[];
    const result = Util.toHexString(byteArray);
    expect(result).toBe(hexString);
  });
});
