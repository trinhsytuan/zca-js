export type GetAvatarUrlProfileResponse = {
    [userId: string]: {
        avatar: string;
    };
};
export declare const getAvatarUrlProfileFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (friendIds: string | string[], isAvatarSizeMax?: boolean) => Promise<GetAvatarUrlProfileResponse>;
