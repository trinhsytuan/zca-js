import type { ThreadType } from "../models/Enum.js";
export type SetArchivedConversationsTarget = {
    id: string;
    type: ThreadType;
};
export type SetArchivedConversationsResponse = {
    needResync: boolean;
    version: number;
};
export declare const setArchivedConversationsFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (isArchived: boolean, conversations: SetArchivedConversationsTarget | SetArchivedConversationsTarget[]) => Promise<SetArchivedConversationsResponse>;
