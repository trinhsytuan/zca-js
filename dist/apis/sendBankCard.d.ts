import { ThreadType, BinBankCard } from "../models/index.js";
export type SendBankCardPayload = {
    binBank: BinBankCard;
    numAccBank: string;
    nameAccBank?: string;
};
export type SendBankCardResponse = "";
export declare const sendBankCardFactory: (ctx: import("../context.js").ContextBase, api: import("../zalo.js").API) => (payload: SendBankCardPayload, threadId: string, type: ThreadType) => Promise<"">;
