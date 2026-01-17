declare module 'mammoth' {
    export interface MammothResult {
        value: string;
        messages: any[];
    }
    export function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<MammothResult>;
}
