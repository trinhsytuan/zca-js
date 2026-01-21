import type { UserBasic } from "../models/index.js";
export type GetMultiUsersByPhoneResponse = {
    [phoneNumber: string]: UserBasic;
};
export declare const getMultiUsersByPhoneFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (phoneNumbers: string | string[], isAvatarSizeMax?: boolean) => Promise<GetMultiUsersByPhoneResponse>;
