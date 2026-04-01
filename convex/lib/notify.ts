import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";

type NotificationType =
    | "message"
    | "expense"
    | "join_request"
    | "poll"
    | "comment"
    | "settlement"
    | "member_joined";

interface NotifyTripOpts {
    tripId: Id<"trip">;
    excludeUserId: string;
    type: NotificationType;
    referenceId?: string;
    title: string;
    body: string;
    url: string;
}

interface NotifyUserOpts {
    userId: string;
    type: NotificationType;
    tripId: Id<"trip">;
    referenceId?: string;
    title: string;
    body: string;
    url: string;
}

export async function notifyTrip(ctx: MutationCtx, opts: NotifyTripOpts) {
    await ctx.scheduler.runAfter(
        0,
        internal.methods.notifications.notifyTripMembers,
        opts
    );
}

export async function notifyUser(ctx: MutationCtx, opts: NotifyUserOpts) {
    await ctx.scheduler.runAfter(
        0,
        internal.methods.notifications.createNotification,
        opts
    );
}
