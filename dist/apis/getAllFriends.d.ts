import type { User } from "../models/index.js";
export type GetAllFriendsResponse = User[];
export declare const getAllFriendsFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (count?: number, page?: number, isAvatarSizeMax?: boolean) => Promise<GetAllFriendsResponse>;
