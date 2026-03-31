import type {
    NominatimResult,
    WikiCommonsPage,
    OpenMeteoForecast,
    WeatherData,
} from "./types";

export async function searchNominatim(query: string) {
    const params = new URLSearchParams({
        q: query,
        format: "json",
        addressdetails: "1",
        limit: "10",
        "accept-language": "en",
    });
    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`
    );
    if (!response.ok) throw new Error("Nominatim API error");
    const data = (await response.json()) as NominatimResult[];
    return data.map((item) => ({
        osmId: `${item.osm_type}:${item.osm_id}`,
        name: item.name || item.display_name?.split(",")[0] || "",
        address: item.display_name || "",
        lat: parseFloat(item.lat) || null,
        lng: parseFloat(item.lon) || null,
    }));
}

export async function fetchWikimediaPhoto(
    lat: number,
    lng: number,
    name?: string
): Promise<{ photoUrl: string; attribution: string | null } | null> {
    if (name) {
        try {
            const searchParams = new URLSearchParams({
                action: "query",
                format: "json",
                titles: name,
                prop: "pageimages",
                piprop: "original",
                pilimit: "1",
                redirects: "1",
                origin: "*",
            });
            const res = await fetch(
                `https://en.wikipedia.org/w/api.php?${searchParams}`
            );
            if (res.ok) {
                const data = (await res.json()) as {
                    query?: {
                        pages?: Record<
                            string,
                            { original?: { source?: string } }
                        >;
                    };
                };
                const pages = data.query?.pages;
                if (pages) {
                    for (const page of Object.values(pages)) {
                        if (page.original?.source) {
                            return {
                                photoUrl: page.original.source,
                                attribution: "Wikipedia",
                            };
                        }
                    }
                }
            }
        } catch {
            /* fall through to geosearch */
        }
    }

    const params = new URLSearchParams({
        action: "query",
        format: "json",
        generator: "geosearch",
        ggsprimary: "all",
        ggsnamespace: "6",
        ggsradius: "300",
        ggscoord: `${lat}|${lng}`,
        ggslimit: "5",
        prop: "imageinfo",
        iiprop: "url|extmetadata|mime",
        iiurlwidth: "600",
        origin: "*",
    });
    try {
        const res = await fetch(
            `https://commons.wikimedia.org/w/api.php?${params}`
        );
        if (!res.ok) return null;
        const data = (await res.json()) as {
            query?: {
                pages?: Record<
                    string,
                    WikiCommonsPage & { imageinfo?: { mime?: string }[] }
                >;
            };
        };
        const pages = data.query?.pages;
        if (!pages) return null;
        for (const page of Object.values(pages)) {
            const info = page.imageinfo?.[0];
            const mime = (info as { mime?: string })?.mime || "";
            if (
                info?.url &&
                (mime.startsWith("image/jpeg") || mime.startsWith("image/png"))
            ) {
                const attribution =
                    info.extmetadata?.Artist?.value
                        ?.replace(/<[^>]+>/g, "")
                        .trim() || null;
                return { photoUrl: info.url, attribution };
            }
        }
        return null;
    } catch {
        return null;
    }
}

const WMO_MAP: Record<number, string> = {
    0: "Clear",
    1: "Clear",
    2: "Clouds",
    3: "Clouds",
    45: "Fog",
    48: "Fog",
    51: "Drizzle",
    53: "Drizzle",
    55: "Drizzle",
    61: "Rain",
    63: "Rain",
    65: "Rain",
    71: "Snow",
    73: "Snow",
    75: "Snow",
    80: "Rain",
    81: "Rain",
    82: "Rain",
    95: "Thunderstorm",
    96: "Thunderstorm",
    99: "Thunderstorm",
};

const WMO_DESC: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    80: "Light showers",
    81: "Showers",
    82: "Heavy showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Severe thunderstorm",
};

export async function fetchWeather(
    lat: number,
    lng: number,
    date: string
): Promise<WeatherData | null> {
    const [y, m, d] = date.split("-").map(Number);
    const targetDate = new Date(y, m - 1, d);
    const now = new Date();
    const todayMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );
    const diffDays = Math.round(
        (targetDate.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24)
    );

    try {
        if (diffDays >= -1 && diffDays <= 16) {
            const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const url =
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
                `&hourly=temperature_2m,precipitation_probability,weathercode` +
                `&daily=temperature_2m_max,temperature_2m_min,weathercode,sunrise,sunset,precipitation_probability_max,precipitation_sum,windspeed_10m_max` +
                `&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`;

            const res = await fetch(url);
            if (!res.ok) return null;
            const data = (await res.json()) as OpenMeteoForecast;
            if (data.error || !data.daily?.time?.length) return null;

            const code = data.daily.weathercode[0];
            const formatTime = (iso?: string) =>
                iso ? (iso.split("T")[1]?.slice(0, 5) ?? "") : "";

            const hourly: WeatherData["hourly"] = [];
            if (data.hourly?.time) {
                for (let i = 0; i < data.hourly.time.length; i++) {
                    hourly.push({
                        hour: new Date(data.hourly.time[i]).getHours(),
                        temp: Math.round(data.hourly.temperature_2m[i]),
                        precipitationProbability:
                            data.hourly.precipitation_probability?.[i] ?? 0,
                        main:
                            WMO_MAP[data.hourly.weathercode?.[i] ?? 0] ??
                            "Clouds",
                    });
                }
            }

            return {
                type: "forecast",
                temp: Math.round(
                    (data.daily.temperature_2m_max[0] +
                        data.daily.temperature_2m_min[0]) /
                        2
                ),
                tempMax: Math.round(data.daily.temperature_2m_max[0]),
                tempMin: Math.round(data.daily.temperature_2m_min[0]),
                main: WMO_MAP[code] ?? "Clouds",
                description: WMO_DESC[code] ?? "",
                sunrise: formatTime(data.daily.sunrise?.[0]),
                sunset: formatTime(data.daily.sunset?.[0]),
                precipitationSum: data.daily.precipitation_sum?.[0] ?? 0,
                precipitationProbabilityMax:
                    data.daily.precipitation_probability_max?.[0] ?? 0,
                windMax: Math.round(data.daily.windspeed_10m_max?.[0] ?? 0),
                hourly,
            };
        }

        if (diffDays > 16) {
            const refYear = targetDate.getFullYear() - 1;
            const refDate = `${refYear}-${String(targetDate.getMonth() + 1).padStart(2, "0")}-${String(targetDate.getDate()).padStart(2, "0")}`;
            const url =
                `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}` +
                `&start_date=${refDate}&end_date=${refDate}` +
                `&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,windspeed_10m_max,sunrise,sunset` +
                `&timezone=auto`;

            const res = await fetch(url);
            if (!res.ok) return null;
            const data = (await res.json()) as OpenMeteoForecast;
            if (data.error || !data.daily?.time?.length) return null;

            const code = data.daily.weathercode[0];
            const formatTime = (iso?: string) =>
                iso ? (iso.split("T")[1]?.slice(0, 5) ?? "") : "";

            return {
                type: "climate",
                temp: Math.round(
                    (data.daily.temperature_2m_max[0] +
                        data.daily.temperature_2m_min[0]) /
                        2
                ),
                tempMax: Math.round(data.daily.temperature_2m_max[0]),
                tempMin: Math.round(data.daily.temperature_2m_min[0]),
                main: WMO_MAP[code] ?? "Clouds",
                description: WMO_DESC[code] ?? "",
                precipitationSum:
                    Math.round((data.daily.precipitation_sum?.[0] ?? 0) * 10) /
                    10,
                windMax: Math.round(data.daily.windspeed_10m_max?.[0] ?? 0),
                sunrise: formatTime(data.daily.sunrise?.[0]),
                sunset: formatTime(data.daily.sunset?.[0]),
            };
        }

        return null;
    } catch {
        return null;
    }
}
