import { RateLimiter, MINUTE, HOUR } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

const rateLimits = {
    sendMessage: {
        kind: "token bucket",
        rate: 10,
        period: MINUTE,
        capacity: 3,
    },
    editMessage: {
        kind: "token bucket",
        rate: 10,
        period: MINUTE,
        capacity: 2,
    },
    deleteMessage: {
        kind: "token bucket",
        rate: 10,
        period: MINUTE,
        capacity: 2,
    },
    addReaction: {
        kind: "token bucket",
        rate: 15,
        period: MINUTE,
        capacity: 5,
    },
    removeReaction: {
        kind: "token bucket",
        rate: 15,
        period: MINUTE,
        capacity: 5,
    },
    pinMessage: { kind: "fixed window", rate: 10, period: MINUTE },
    votePoll: { kind: "token bucket", rate: 15, period: MINUTE, capacity: 5 },

    createExpense: {
        kind: "token bucket",
        rate: 5,
        period: MINUTE,
        capacity: 3,
    },
    updateExpense: {
        kind: "token bucket",
        rate: 10,
        period: MINUTE,
        capacity: 3,
    },
    deleteExpense: {
        kind: "token bucket",
        rate: 5,
        period: MINUTE,
        capacity: 2,
    },
    createSettlement: {
        kind: "token bucket",
        rate: 5,
        period: MINUTE,
        capacity: 2,
    },

    createTrip: { kind: "token bucket", rate: 3, period: MINUTE, capacity: 2 },
    updateTrip: { kind: "token bucket", rate: 5, period: MINUTE, capacity: 2 },
    deleteTrip: { kind: "fixed window", rate: 3, period: MINUTE },

    sendJoinRequest: {
        kind: "token bucket",
        rate: 5,
        period: MINUTE,
        capacity: 2,
    },
    sendInvite: { kind: "token bucket", rate: 10, period: MINUTE, capacity: 3 },

    generateUploadUrl: {
        kind: "token bucket",
        rate: 10,
        period: HOUR,
        capacity: 3,
    },

    upsertBlog: { kind: "token bucket", rate: 5, period: MINUTE, capacity: 2 },
    deleteBlog: { kind: "fixed window", rate: 3, period: MINUTE },

    createComment: {
        kind: "token bucket",
        rate: 8,
        period: MINUTE,
        capacity: 3,
    },
    editComment: {
        kind: "token bucket",
        rate: 10,
        period: MINUTE,
        capacity: 3,
    },

    rateBlog: { kind: "token bucket", rate: 10, period: MINUTE, capacity: 3 },

    addToHistory: {
        kind: "token bucket",
        rate: 10,
        period: MINUTE,
        capacity: 5,
    },
} as const;

export type RateLimitName = keyof typeof rateLimits;

export const rateLimiter = new RateLimiter(components.rateLimiter, rateLimits);
