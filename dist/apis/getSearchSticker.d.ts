import type { StickerBasic } from "../models/index.js";
export type GetSearchStickerResponse = StickerBasic[];
export declare const getSearchStickerFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (keyword: string, limit?: number) => Promise<GetSearchStickerResponse>;
