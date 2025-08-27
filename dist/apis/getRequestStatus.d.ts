export type GetRequestStatusResponse = {
    addFriendPrivacy: number;
    isSeenFriendReq: boolean;
    is_friend: number;
    is_requested: number;
    is_requesting: number;
};
export declare const getRequestStatusFactory: (ctx: import("../context.js").ContextBase, api: import("../zalo.js").API) => (friendId: string) => Promise<GetRequestStatusResponse>;
