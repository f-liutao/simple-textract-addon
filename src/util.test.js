import { describe, expect, test } from "@jest/globals";
import { Util } from "./util";
describe("test for util.ts", () => {
    test("toHexString", () => {
        const hexString = "09020e0a";
        const byteArray = [9, 2, 14, 10];
        const result = Util.toHexString(byteArray);
        expect(result).toBe(hexString);
    });
});
