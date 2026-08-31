export type AuditPrimitive =
    | string
    | number
    | boolean
    | null;

export type AuditValue =
    | AuditPrimitive
    | AuditPrimitive[]
    | Record<string, unknown>
    | unknown[];

export interface AuditRow {
    [key: string]: AuditValue;
}