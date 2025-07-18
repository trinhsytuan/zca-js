export type GetReminderResponsesResponse = {
    rejectMember: string[];
    acceptMember: string[];
};
export declare const getReminderResponsesFactory: (ctx: import("../context.js").ContextBase, api: import("../zalo.js").API) => (reminderId: string) => Promise<GetReminderResponsesResponse>;
