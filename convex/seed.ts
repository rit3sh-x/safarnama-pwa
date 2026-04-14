import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { nanoid } from "nanoid";

const SEED_ORG_ID = nanoid(10);
const SEED_USER_ID = nanoid(10);

const DAY_MS = 24 * 60 * 60 * 1000;

const DESTINATIONS: { city: string; country: string; img: string }[] = [
    {
        city: "Paris",
        country: "France",
        img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200",
    },
    {
        city: "Tokyo",
        country: "Japan",
        img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200",
    },
    {
        city: "Reykjavik",
        country: "Iceland",
        img: "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=1200",
    },
    {
        city: "Lisbon",
        country: "Portugal",
        img: "https://images.unsplash.com/photo-1513735492246-483525079686?w=1200",
    },
    {
        city: "Marrakech",
        country: "Morocco",
        img: "https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=1200",
    },
    {
        city: "Kyoto",
        country: "Japan",
        img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200",
    },
    {
        city: "Istanbul",
        country: "Türkiye",
        img: "https://images.unsplash.com/photo-1527838832700-5059252407fa?w=1200",
    },
    {
        city: "Cusco",
        country: "Peru",
        img: "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1200",
    },
    {
        city: "Cape Town",
        country: "South Africa",
        img: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1200",
    },
    {
        city: "Hanoi",
        country: "Vietnam",
        img: "https://images.unsplash.com/photo-1555921015-5532091f6026?w=1200",
    },
    {
        city: "Bali",
        country: "Indonesia",
        img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200",
    },
    {
        city: "Edinburgh",
        country: "Scotland",
        img: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=1200",
    },
    {
        city: "Oaxaca",
        country: "Mexico",
        img: "https://images.unsplash.com/photo-1518638150340-f706e86654de?w=1200",
    },
    {
        city: "Petra",
        country: "Jordan",
        img: "https://images.unsplash.com/photo-1527838832700-5059252407fa?w=1200",
    },
    {
        city: "Queenstown",
        country: "New Zealand",
        img: "https://images.unsplash.com/photo-1469521669194-babb45599def?w=1200",
    },
];

const TITLE_TEMPLATES = [
    "A week in {city}",
    "Exploring {city}",
    "{city} on a budget",
    "{city} slow-travel diary",
    "Family trip to {city}",
    "Solo in {city}",
    "{city} food crawl",
    "Off the beaten path in {city}",
    "{city} in golden hour",
    "Ten days around {city}",
];

const DESCRIPTIONS = [
    "A mix of classic sights, hidden alleys, and too many pastries to count.",
    "We planned half, improvised the rest, and came back with a camera full of stories.",
    "Slow mornings, long walks, and the kind of rain that turns a city into a painting.",
    "Booked it on a whim. Everything after was serendipity.",
    "Trains, terraces, and a running list of places we'd return to.",
    "From sunrise hikes to late-night markets, we said yes to everything.",
    "A ten-day love letter to a city we'd only ever seen in pictures.",
    "More questions than answers by the end — the best kind of trip.",
];

const BLOG_PARAGRAPHS = [
    "Getting there was half the adventure. We landed in the early afternoon, dropped our bags at a guesthouse that smelled faintly of cedar and citrus, and went straight out looking for coffee.",
    "The old town unfolded in layers. You'd follow one lane thinking it would end, and it just kept giving: a courtyard, a vine-covered cafe, a tiny shop selling hand-painted tiles.",
    "Dinner was at a place our host insisted we try. No menu, no English, just a woman pointing at today's fish and smiling like she already knew we'd order it.",
    "We walked until our feet gave up, then caught a tram back. Watching the city blur past the window felt like a reward for nothing in particular.",
    "Morning four was the best one. We woke early on purpose, beat the tour groups to the viewpoint, and had the whole skyline to ourselves for about twenty minutes.",
    "Someone had told us the market was overrated. They were wrong. We left with three paper bags of things we couldn't quite name and a recipe written on a napkin.",
    "A short train ride out of the city put us in a completely different landscape. Rolling hills, a single cafe with three tables, and a cat that refused to move off the only sunny chair.",
    "By the last day we were moving more slowly on purpose. Stretched out the final coffee. Ordered one more of the pastry we'd been rationing. Took the long way to the airport.",
];

function pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: readonly T[], n: number): T[] {
    const copy = [...arr];
    const out: T[] = [];
    for (let i = 0; i < n && copy.length > 0; i++) {
        const idx = Math.floor(Math.random() * copy.length);
        out.push(copy.splice(idx, 1)[0]);
    }
    return out;
}

function randomTripDates(): { start: number; end: number } {
    const offsetDays = Math.floor(Math.random() * 270) - 180;
    const lengthDays = 3 + Math.floor(Math.random() * 12);
    const start = Date.now() + offsetDays * DAY_MS;
    const end = start + lengthDays * DAY_MS;
    return { start, end };
}

interface TipTapTextMark {
    type: string;
    attrs?: Record<string, unknown>;
}
interface TipTapNode {
    type: string;
    attrs?: Record<string, unknown>;
    content?: TipTapNode[];
    text?: string;
    marks?: TipTapTextMark[];
}

function buildBlogContent(
    title: string,
    destination: string,
    paragraphCount: number
): string {
    const paragraphs = pickN(BLOG_PARAGRAPHS, paragraphCount);
    const nodes: TipTapNode[] = [
        {
            type: "heading",
            attrs: { level: 2, textAlign: null, lineHeight: "normal" },
            content: [{ type: "text", text: title }],
        },
        {
            type: "paragraph",
            attrs: { textAlign: null, lineHeight: "normal" },
            content: [
                {
                    type: "text",
                    text: `A few notes from ${destination}.`,
                    marks: [
                        {
                            type: "textStyle",
                            attrs: {
                                fontSize: null,
                                color: "#7f8c8d",
                                fontFamily: null,
                            },
                        },
                    ],
                },
            ],
        },
    ];

    for (const p of paragraphs) {
        nodes.push({
            type: "paragraph",
            attrs: { textAlign: null, lineHeight: "normal" },
            content: [{ type: "text", text: p }],
        });
    }

    return JSON.stringify({ type: "doc", content: nodes });
}

async function seedTripsAndBlogsImpl(
    ctx: MutationCtx,
    opts: {
        orgId: string;
        userId: string;
        count: number;
        isPublic: boolean;
    }
): Promise<{ trips: number; blogs: number }> {
    const { orgId, userId, count, isPublic } = opts;
    const now = Date.now();
    let tripsCreated = 0;
    let blogsCreated = 0;

    for (let i = 0; i < count; i++) {
        const dest = pick(DESTINATIONS);
        const titleTemplate = pick(TITLE_TEMPLATES);
        const title = titleTemplate.replace("{city}", dest.city);
        const description = pick(DESCRIPTIONS);
        const destinationLabel = `${dest.city}, ${dest.country}`;
        const { start, end } = randomTripDates();

        const searchText =
            `${title} ${destinationLabel} ${description}`.toLowerCase();

        const tripId = await ctx.db.insert("trip", {
            orgId,
            title,
            description,
            destination: destinationLabel,
            startDate: start,
            endDate: end,
            isPublic,
            createdBy: userId,
            updatedAt: now,
            searchText,
        });
        tripsCreated++;

        await ctx.db.insert("tripMember", {
            tripId,
            userId,
        });

        const paragraphCount = 3 + Math.floor(Math.random() * 4);
        const content = buildBlogContent(
            title,
            destinationLabel,
            paragraphCount
        );

        const publishedAt =
            now - i * 60_000 - Math.floor(Math.random() * 30_000);

        await ctx.db.insert("blog", {
            tripId,
            title,
            content,
            coverImage: dest.img,
            publishedAt,
            updatedAt: publishedAt,
            tripTitle: title,
            tripDestination: destinationLabel,
        });
        blogsCreated++;
    }

    return { trips: tripsCreated, blogs: blogsCreated };
}

export const seedTripsAndBlogs = internalMutation({
    args: {
        orgId: v.string(),
        userId: v.string(),
        count: v.optional(v.number()),
        isPublic: v.optional(v.boolean()),
    },
    returns: v.object({
        trips: v.number(),
        blogs: v.number(),
    }),
    handler: async (ctx, { orgId, userId, count = 15, isPublic = true }) => {
        return seedTripsAndBlogsImpl(ctx, {
            orgId,
            userId,
            count: count ?? 15,
            isPublic: isPublic ?? true,
        });
    },
});

export const data = internalMutation({
    args: {
        count: v.optional(v.number()),
    },
    returns: v.object({
        trips: v.number(),
        blogs: v.number(),
        seedUserId: v.string(),
    }),
    handler: async (ctx, { count }) => {
        const result = await seedTripsAndBlogsImpl(ctx, {
            orgId: SEED_ORG_ID,
            userId: SEED_USER_ID,
            count: count ?? 15,
            isPublic: true,
        });
        return { ...result, seedUserId: SEED_USER_ID };
    },
});

async function wipeUserImpl(
    ctx: MutationCtx,
    userId: string
): Promise<{ trips: number; blogs: number; members: number }> {
    const trips = await ctx.db
        .query("trip")
        .withIndex("createdBy", (q) => q.eq("createdBy", userId))
        .collect();

    let blogsDeleted = 0;
    let membersDeleted = 0;

    for (const trip of trips) {
        const tripBlogs = await ctx.db
            .query("blog")
            .withIndex("tripId", (q) => q.eq("tripId", trip._id))
            .collect();
        for (const b of tripBlogs) {
            await ctx.db.delete(b._id);
            blogsDeleted++;
        }

        const members = await ctx.db
            .query("tripMember")
            .filter((q) => q.eq(q.field("tripId"), trip._id))
            .collect();
        for (const m of members) {
            await ctx.db.delete(m._id);
            membersDeleted++;
        }

        await ctx.db.delete(trip._id);
    }

    return {
        trips: trips.length,
        blogs: blogsDeleted,
        members: membersDeleted,
    };
}

export const wipeUserTripsAndBlogs = internalMutation({
    args: {
        userId: v.string(),
    },
    returns: v.object({
        trips: v.number(),
        blogs: v.number(),
        members: v.number(),
    }),
    handler: async (ctx, { userId }) => wipeUserImpl(ctx, userId),
});

export const wipe = internalMutation({
    args: {},
    returns: v.object({
        trips: v.number(),
        blogs: v.number(),
        members: v.number(),
    }),
    handler: async (ctx) => {
        return wipeUserImpl(ctx, SEED_USER_ID);
    },
});
