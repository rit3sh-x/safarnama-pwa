import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  trip: defineTable({
    orgId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    destination: v.string(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    isPublic: v.boolean(),
    createdBy: v.string(),
    updatedAt: v.number(),
    itineraryStatus: v.optional(
      v.union(
        v.literal("empty"),
        v.literal("planning"),
        v.literal("done"),
        v.literal("error")
      )
    ),
  })
    .index("orgId", ["orgId"])
    .index("isPublic", ["isPublic"])
    .index("createdBy", ["createdBy"])
    .searchIndex("search", {
      searchField: "title",
      filterFields: ["createdBy"],
    }),

  tripMember: defineTable({
    tripId: v.id("trip"),
    userId: v.string(),
  }).index("userId", ["userId"]),

  itinerary: defineTable({
    tripId: v.id("trip"),
    day: v.number(),
    date: v.string(),
    dayTheme: v.optional(v.string()),
    items: v.array(
      v.object({
        time: v.string(),
        duration: v.string(),
        category: v.union(
          v.literal("food"),
          v.literal("activity"),
          v.literal("transport"),
          v.literal("accommodation"),
          v.literal("shopping"),
          v.literal("other")
        ),
        title: v.string(),
        description: v.string(),
        location: v.string(),
        pricing: v.object({
          amount: v.number(),
          currency: v.string(),
          note: v.string(),
        }),
        weather: v.string(),
        tips: v.array(v.string()),
        imageUrl: v.string(),
        imageSource: v.optional(v.string()),
        rating: v.optional(v.number()),
        bookingUrl: v.optional(v.string()),
      })
    ),
  }).index("by_trip", ["tripId"]),

  blog: defineTable({
    tripId: v.id("trip"),
    title: v.string(),
    content: v.string(),
    coverImage: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("published")),
    publishedAt: v.optional(v.number()),
    updatedAt: v.number(),
    tripTitle: v.string(),
    tripDestination: v.string(),
  })
    .index("tripId", ["tripId"])
    .searchIndex("search", {
      searchField: "title",
      filterFields: ["status"],
    }),

  blogComment: defineTable({
    blogId: v.id("blog"),
    authorId: v.string(),
    content: v.string(),
    parentId: v.optional(v.id("blogComment")),
    editedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  })
    .index("blogId", ["blogId"])
    .index("parentId", ["parentId"]),

  blogRating: defineTable({
    blogId: v.id("blog"),
    userId: v.string(),
    rating: v.number(),
  })
    .index("blogId", ["blogId"])
    .index("blogId_userId", ["blogId", "userId"]),

  joinRequest: defineTable({
    tripId: v.id("trip"),
    orgId: v.string(),
    userId: v.string(),
    message: v.optional(v.string()),
    type: v.union(v.literal("user_request"), v.literal("admin_invite")),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected")
    ),
    tripTitle: v.string(),
    userName: v.string(),
  })
    .index("tripId", ["tripId"])
    .index("tripId_status", ["tripId", "status"])
    .index("userId_tripId", ["userId", "tripId"])
    .searchIndex("search_by_trip", {
      searchField: "tripTitle",
      filterFields: ["userId", "status"],
    })
    .searchIndex("search_by_user", {
      searchField: "userName",
      filterFields: ["tripId", "status", "type"],
    }),

  message: defineTable({
    tripId: v.id("trip"),
    senderId: v.string(),
    type: v.union(
      v.literal("message"),
      v.literal("expense_event"),
      v.literal("member_joined"),
      v.literal("member_left"),
      v.literal("member_invited")
    ),
    content: v.string(),
    expenseId: v.optional(v.id("expense")),
    replyToId: v.optional(v.id("message")),
    attachmentUrl: v.optional(v.string()),
    attachmentType: v.optional(v.union(v.literal("image"), v.literal("file"))),
    editedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
    pinnedAt: v.optional(v.number()),
    pinnedBy: v.optional(v.string()),
  })
    .index("tripId", ["tripId"])
    .index("senderId", ["senderId"])
    .index("tripId_type", ["tripId", "type"]),

  expense: defineTable({
    tripId: v.id("trip"),
    title: v.string(),
    amount: v.number(),
    paidBy: v.string(),
    date: v.number(),
    notes: v.optional(v.string()),
    receiptUrl: v.optional(v.string()),
    splitType: v.union(
      v.literal("equal"),
      v.literal("exact"),
      v.literal("percentage"),
      v.literal("payer_only")
    ),
    updatedAt: v.number(),
  })
    .index("tripId", ["tripId"])
    .index("tripId_date", ["tripId", "date"])
    .index("paidBy", ["paidBy"]),

  expenseSplit: defineTable({
    expenseId: v.id("expense"),
    tripId: v.id("trip"),
    userId: v.string(),
    owedAmount: v.number(),
    percentage: v.optional(v.number()),
    settled: v.boolean(),
    settledAt: v.optional(v.number()),
  })
    .index("tripId", ["tripId"])
    .index("expenseId", ["expenseId"])
    .index("tripId_userId", ["tripId", "userId"])
    .index("userId_settled", ["userId", "settled"]),

  reaction: defineTable({
    messageId: v.id("message"),
    tripId: v.id("trip"),
    userId: v.string(),
    emoji: v.string(),
  })
    .index("messageId", ["messageId"])
    .index("messageId_userId_emoji", ["messageId", "userId", "emoji"]),

  messageReadCursor: defineTable({
    tripId: v.id("trip"),
    userId: v.string(),
    lastReadTime: v.number(),
  })
    .index("tripId", ["tripId"])
    .index("tripId_userId", ["tripId", "userId"]),

  settlement: defineTable({
    tripId: v.id("trip"),
    fromUserId: v.string(),
    toUserId: v.string(),
    amount: v.number(),
    note: v.optional(v.string()),
  })
    .index("tripId", ["tripId"])
    .index("fromUserId", ["fromUserId"])
    .index("toUserId", ["toUserId"]),
})
