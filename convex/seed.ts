import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const SEED_ORG_ID = "seed_org_id";
const SEED_USER_ID = "seed_user_id";

const DAY_MS = 24 * 60 * 60 * 1000;

type Destination = {
    city: string;
    country: string;
    img: string;
    center: [number, number];
};

const DESTINATIONS: Destination[] = [
    {
        city: "Paris",
        country: "France",
        img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200",
        center: [48.8566, 2.3522],
    },
    {
        city: "Solan",
        country: "India",
        img: "https://images.unsplash.com/photo-1559141362-be4b781e79c2?w=1200",
        center: [30.9083, 77.0967],
    },
    {
        city: "Kasol",
        country: "India",
        img: "https://images.unsplash.com/photo-1612638039814-1a67ea727114?w=1200",
        center: [32.0098, 77.3151],
    },
    {
        city: "Dharamshala",
        country: "India",
        img: "https://images.unsplash.com/photo-1581321863389-ef7d7bfe4b75?w=1200",
        center: [32.219, 76.3234],
    },
    {
        city: "Hauz Khas",
        country: "India",
        img: "https://images.unsplash.com/photo-1747491746369-1a7ee2f2e825?w=1200",
        center: [28.5494, 77.2001],
    },
    {
        city: "Westphalia",
        country: "Germany",
        img: "https://images.unsplash.com/photo-1607778775701-dc20311cfb0f?w=1200",
        center: [51.9607, 7.6261],
    },
    {
        city: "Tokyo",
        country: "Japan",
        img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200",
        center: [35.6762, 139.6503],
    },
    {
        city: "Reykjavik",
        country: "Iceland",
        img: "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=1200",
        center: [64.1466, -21.9426],
    },
    {
        city: "Lisbon",
        country: "Portugal",
        img: "https://images.unsplash.com/photo-1513735492246-483525079686?w=1200",
        center: [38.7223, -9.1393],
    },
    {
        city: "Marrakech",
        country: "Morocco",
        img: "https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=1200",
        center: [31.6295, -7.9811],
    },
    {
        city: "Kyoto",
        country: "Japan",
        img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200",
        center: [35.0116, 135.7681],
    },
    {
        city: "Istanbul",
        country: "Türkiye",
        img: "https://images.unsplash.com/photo-1527838832700-5059252407fa?w=1200",
        center: [41.0082, 28.9784],
    },
    {
        city: "Cusco",
        country: "Peru",
        img: "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1200",
        center: [-13.5319, -71.9675],
    },
    {
        city: "Cape Town",
        country: "South Africa",
        img: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1200",
        center: [-33.9249, 18.4241],
    },
    {
        city: "Hanoi",
        country: "Vietnam",
        img: "https://images.unsplash.com/photo-1555921015-5532091f6026?w=1200",
        center: [21.0285, 105.8542],
    },
    {
        city: "Bali",
        country: "Indonesia",
        img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200",
        center: [-8.65, 115.2167],
    },
    {
        city: "Edinburgh",
        country: "Scotland",
        img: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=1200",
        center: [55.9533, -3.1883],
    },
    {
        city: "Oaxaca",
        country: "Mexico",
        img: "https://images.unsplash.com/photo-1518638150340-f706e86654de?w=1200",
        center: [17.0732, -96.7266],
    },
    {
        city: "Petra",
        country: "Jordan",
        img: "https://images.unsplash.com/photo-1527838832700-5059252407fa?w=1200",
        center: [30.3285, 35.4444],
    },
    {
        city: "Queenstown",
        country: "New Zealand",
        img: "https://images.unsplash.com/photo-1469521669194-babb45599def?w=1200",
        center: [-45.0312, 168.6626],
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

const TAGS = [
    "solo",
    "family",
    "adventure",
    "budget",
    "luxury",
    "food",
    "culture",
    "nature",
    "mountain",
    "beach",
    "road-trip",
    "backpacking",
    "photography",
    "winter",
    "summer",
];

const PLACE_NAMES = [
    "Old Town Square",
    "Central Market",
    "Sunset Viewpoint",
    "Riverside Café",
    "Historic Temple",
    "Art District Mural",
    "Street Food Lane",
    "Hidden Garden",
    "Harbor Walk",
    "Night Bazaar",
    "Museum Quarter",
    "Mountain Lookout",
];

async function fetchPlaceImage(
    name: string,
    lat: number,
    lng: number
): Promise<string | undefined> {
    // Try Wikipedia page image first
    try {
        const params = new URLSearchParams({
            action: "query",
            format: "json",
            titles: name,
            prop: "pageimages",
            piprop: "original",
            pilimit: "1",
            redirects: "1",
            origin: "*",
        });
        const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);
        if (res.ok) {
            const data = await res.json();
            const pages = data?.query?.pages;
            if (pages) {
                for (const page of Object.values(pages) as Array<{
                    original?: { source?: string };
                }>) {
                    if (page.original?.source) return page.original.source;
                }
            }
        }
    } catch {
        /* fall through */
    }

    // Fallback: Wikimedia Commons geosearch
    try {
        const params = new URLSearchParams({
            action: "query",
            format: "json",
            generator: "geosearch",
            ggsprimary: "all",
            ggsnamespace: "6",
            ggsradius: "500",
            ggscoord: `${lat}|${lng}`,
            ggslimit: "3",
            prop: "imageinfo",
            iiprop: "url|mime",
            iiurlwidth: "600",
            origin: "*",
        });
        const res = await fetch(
            `https://commons.wikimedia.org/w/api.php?${params}`
        );
        if (res.ok) {
            const data = await res.json();
            const pages = data?.query?.pages;
            if (pages) {
                for (const page of Object.values(pages) as Array<{
                    imageinfo?: Array<{ url?: string; mime?: string }>;
                }>) {
                    const info = page.imageinfo?.[0];
                    if (
                        info?.url &&
                        (info.mime?.startsWith("image/jpeg") ||
                            info.mime?.startsWith("image/png"))
                    ) {
                        return info.url;
                    }
                }
            }
        }
    } catch {
        /* ignore */
    }

    return undefined;
}

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

function shuffle<T>(arr: readonly T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function randomTripDates(): { start: number; end: number } {
    const offsetDays = Math.floor(Math.random() * 270) - 180;
    const lengthDays = 3 + Math.floor(Math.random() * 12);
    const start = Date.now() + offsetDays * DAY_MS;
    const end = start + lengthDays * DAY_MS;
    return { start, end };
}

function randomBudget(country: string): { amount: number; currency: string } {
    if (country === "India") {
        return {
            amount: 10_000 + Math.floor(Math.random() * 90_000),
            currency: "INR",
        };
    }
    return {
        amount: 500 + Math.floor(Math.random() * 4_500),
        currency: "USD",
    };
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
): Promise<{ trips: number; blogs: number; places: number }> {
    const { orgId, userId, count, isPublic } = opts;
    const now = Date.now();
    let tripsCreated = 0;
    let blogsCreated = 0;
    let placesCreated = 0;
    const seededDestinations = shuffle(DESTINATIONS);

    for (let i = 0; i < count; i++) {
        const dest =
            i < seededDestinations.length
                ? seededDestinations[i]
                : pick(DESTINATIONS);
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

        const placeCount = 3 + Math.floor(Math.random() * 4);
        const chosenPlaceNames = pickN(PLACE_NAMES, placeCount);
        const [centerLat, centerLng] = dest.center;
        const placeIds: Id<"place">[] = [];
        const placeCoords: { lat: number; lng: number }[] = [];
        for (let pi = 0; pi < chosenPlaceNames.length; pi++) {
            const jitterLat = (Math.random() - 0.5) * 0.04;
            const jitterLng = (Math.random() - 0.5) * 0.04;
            const lat = centerLat + jitterLat;
            const lng = centerLng + jitterLng;
            const placeName = `${chosenPlaceNames[pi]}, ${dest.city}`;
            const imageUrl = await fetchPlaceImage(placeName, lat, lng);
            const placeId = await ctx.db.insert("place", {
                tripId,
                name: chosenPlaceNames[pi],
                lat,
                lng,
                order: pi,
                imageUrl,
            });
            placeIds.push(placeId);
            placeCoords.push({ lat, lng });
            placesCreated++;
        }

        const paragraphCount = 3 + Math.floor(Math.random() * 4);
        const content = buildBlogContent(
            title,
            destinationLabel,
            paragraphCount
        );

        const publishedAt =
            now - i * 60_000 - Math.floor(Math.random() * 30_000);

        const tagCount = 2 + Math.floor(Math.random() * 3);
        const tags = pickN(TAGS, tagCount);
        const { amount: budget, currency } = randomBudget(dest.country);

        await ctx.db.insert("blog", {
            tripId,
            title,
            content,
            coverImage: dest.img,
            publishedAt,
            updatedAt: publishedAt,
            tripTitle: title,
            tripDestination: destinationLabel,
            tags,
            startDate: start,
            endDate: end,
            budget,
            currency,
            placeIds,
            placeCount: placeIds.length,
            placeCoords,
            avgRating: 0,
            totalRatings: 0,
        });
        blogsCreated++;
    }

    return { trips: tripsCreated, blogs: blogsCreated, places: placesCreated };
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
        places: v.number(),
    }),
    handler: async (
        ctx,
        { orgId, userId, count = DESTINATIONS.length, isPublic = true }
    ) => {
        return seedTripsAndBlogsImpl(ctx, {
            orgId,
            userId,
            count: count ?? DESTINATIONS.length,
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
        places: v.number(),
        seedUserId: v.string(),
    }),
    handler: async (ctx, { count }) => {
        const result = await seedTripsAndBlogsImpl(ctx, {
            orgId: SEED_ORG_ID,
            userId: SEED_USER_ID,
            count: count ?? DESTINATIONS.length,
            isPublic: true,
        });
        return { ...result, seedUserId: SEED_USER_ID };
    },
});

async function wipeUserImpl(
    ctx: MutationCtx,
    userId: string
): Promise<{
    trips: number;
    blogs: number;
    members: number;
    places: number;
}> {
    const trips = await ctx.db
        .query("trip")
        .withIndex("createdBy", (q) => q.eq("createdBy", userId))
        .collect();

    let blogsDeleted = 0;
    let membersDeleted = 0;
    let placesDeleted = 0;

    for (const trip of trips) {
        const tripBlogs = await ctx.db
            .query("blog")
            .withIndex("tripId", (q) => q.eq("tripId", trip._id))
            .collect();
        for (const b of tripBlogs) {
            await ctx.db.delete(b._id);
            blogsDeleted++;
        }

        const tripPlaces = await ctx.db
            .query("place")
            .withIndex("tripId", (q) => q.eq("tripId", trip._id))
            .collect();
        for (const p of tripPlaces) {
            await ctx.db.delete(p._id);
            placesDeleted++;
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
        places: placesDeleted,
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
        places: v.number(),
    }),
    handler: async (ctx, { userId }) => wipeUserImpl(ctx, userId),
});

export const wipe = internalMutation({
    args: {},
    returns: v.object({
        trips: v.number(),
        blogs: v.number(),
        members: v.number(),
        places: v.number(),
    }),
    handler: async (ctx) => {
        return wipeUserImpl(ctx, SEED_USER_ID);
    },
});

export const backfillBlogAggregates = internalMutation({
    args: {},
    returns: v.object({ patched: v.number() }),
    handler: async (ctx) => {
        const blogs = await ctx.db.query("blog").collect();
        let patched = 0;

        for (const blog of blogs) {
            const ratings = await ctx.db
                .query("blogRating")
                .withIndex("blogId", (q) => q.eq("blogId", blog._id))
                .collect();
            const totalRatings = ratings.length;
            const avgRating =
                totalRatings > 0
                    ? Math.round(
                          (ratings.reduce((s, r) => s + r.rating, 0) /
                              totalRatings) *
                              10
                      ) / 10
                    : 0;

            const placeCoords: { lat: number; lng: number }[] = [];
            for (const pid of blog.placeIds ?? []) {
                const p = await ctx.db.get(pid);
                if (p && p.lat !== undefined && p.lng !== undefined) {
                    placeCoords.push({ lat: p.lat, lng: p.lng });
                }
            }

            await ctx.db.patch(blog._id, {
                avgRating,
                totalRatings,
                placeCount: blog.placeIds?.length ?? 0,
                placeCoords,
            });
            patched++;
        }

        return { patched };
    },
});
