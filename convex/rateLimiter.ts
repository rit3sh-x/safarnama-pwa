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

    deleteComment: { kind: "fixed window", rate: 10, period: MINUTE },

    addDay: { kind: "token bucket", rate: 20, period: MINUTE, capacity: 5 },
    updateDay: { kind: "token bucket", rate: 30, period: MINUTE, capacity: 8 },
    deleteDay: { kind: "fixed window", rate: 10, period: MINUTE },
    movePlace: { kind: "token bucket", rate: 60, period: MINUTE, capacity: 10 },

    addPlace: { kind: "token bucket", rate: 20, period: MINUTE, capacity: 5 },
    updatePlace: {
        kind: "token bucket",
        rate: 30,
        period: MINUTE,
        capacity: 8,
    },
    reorderPlaces: {
        kind: "token bucket",
        rate: 60,
        period: MINUTE,
        capacity: 10,
    },
    deletePlace: { kind: "fixed window", rate: 15, period: MINUTE },

    removeMember: { kind: "fixed window", rate: 5, period: MINUTE },
    leaveTrip: { kind: "fixed window", rate: 5, period: MINUTE },
    changeRole: { kind: "token bucket", rate: 5, period: MINUTE, capacity: 2 },

    reviewRequest: {
        kind: "token bucket",
        rate: 15,
        period: MINUTE,
        capacity: 5,
    },
    cancelRequest: {
        kind: "token bucket",
        rate: 10,
        period: MINUTE,
        capacity: 3,
    },
    cancelInvite: {
        kind: "token bucket",
        rate: 10,
        period: MINUTE,
        capacity: 3,
    },
    reviewInvite: {
        kind: "token bucket",
        rate: 15,
        period: MINUTE,
        capacity: 5,
    },

    closePoll: { kind: "fixed window", rate: 5, period: MINUTE },
    markRead: { kind: "token bucket", rate: 60, period: MINUTE, capacity: 20 },

    pushSubscribe: {
        kind: "token bucket",
        rate: 5,
        period: HOUR,
        capacity: 2,
    },
    pushUnsubscribe: {
        kind: "token bucket",
        rate: 5,
        period: HOUR,
        capacity: 2,
    },
    markNotificationRead: {
        kind: "token bucket",
        rate: 60,
        period: MINUTE,
        capacity: 20,
    },
    markAllNotificationsRead: {
        kind: "fixed window",
        rate: 10,
        period: MINUTE,
    },

    confirmUpload: {
        kind: "token bucket",
        rate: 10,
        period: MINUTE,
        capacity: 3,
    },
} as const;

export type RateLimitName = keyof typeof rateLimits;

export const rateLimiter = new RateLimiter(components.rateLimiter, rateLimits);
