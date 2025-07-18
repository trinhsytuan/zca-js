import { ThreadType } from "../models/index.js";
export type RemoveReminderResponse = "" | number;
export declare const removeReminderFactory: (ctx: import("../context.js").ContextBase, api: import("../zalo.js").API) => (reminderId: string, threadId: string, type?: ThreadType) => Promise<RemoveReminderResponse>;
