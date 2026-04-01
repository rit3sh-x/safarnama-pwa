import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
    "cleanup old notifications",
    { hourUTC: 0, minuteUTC: 0 },
    internal.methods.notifications.cleanupOldNotifications
);

export default crons;
