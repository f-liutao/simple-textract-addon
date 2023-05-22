type Brand<K, T> = K & { __brand: T };
export type HexString = Brand<string, "HexString">;
export type Sha1HashHexString = Brand<HexString, "Sha1HashHexString">;
export type FileName = Brand<string, "FileName">;
export type RFC3339Datetime = Brand<string, "RFC3339Datetime">;
export type Byte = Brand<number, "Byte">;
export type Timezone = Brand<string, "Timezone">;
export type UserLocale = Brand<string, "UserLocale">;
export type AlertTitle = Brand<string, "AlertTitle">;
export type AlertMessage = Brand<string, "AlertMessage">;
export type FolderId = Brand<string, "FolderId">;
export const eventTypes = ["job-start", "start-recognition","end-recognition", "job-completed"] as const;
export type EventType = typeof eventTypes[number]