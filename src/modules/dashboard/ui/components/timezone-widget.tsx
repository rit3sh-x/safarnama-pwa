import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { formatInTimeZone } from "date-fns-tz";

interface TimeZone {
    label: string;
    tz: string;
}

const POPULAR_ZONES: TimeZone[] = [
    { label: "New York", tz: "America/New_York" },
    { label: "London", tz: "Europe/London" },
    { label: "Berlin", tz: "Europe/Berlin" },
    { label: "Paris", tz: "Europe/Paris" },
    { label: "Dubai", tz: "Asia/Dubai" },
    { label: "Mumbai", tz: "Asia/Kolkata" },
    { label: "Bangkok", tz: "Asia/Bangkok" },
    { label: "Tokyo", tz: "Asia/Tokyo" },
    { label: "Sydney", tz: "Australia/Sydney" },
    { label: "Los Angeles", tz: "America/Los_Angeles" },
];

function getTime(tz: string): string {
    try {
        return formatInTimeZone(new Date(), tz, "HH:mm");
    } catch {
        return "—";
    }
}

function getOffset(tz: string): string {
    try {
        const now = new Date();
        const localOffset = -now.getTimezoneOffset() / 60;
        const target = new Date(now.toLocaleString("en-US", { timeZone: tz }));
        const targetOffset = -target.getTimezoneOffset() / 60;
        const diff = targetOffset - localOffset;
        const sign = diff >= 0 ? "+" : "";
        return `${sign}${diff}h`;
    } catch {
        return "";
    }
}

export default function TimezoneWidget() {
    const [zones, setZones] = useState<TimeZone[]>(() => {
        const saved = localStorage.getItem("dashboard_timezones");
        return saved
            ? JSON.parse(saved)
            : [
                  { label: "New York", tz: "America/New_York" },
                  { label: "Tokyo", tz: "Asia/Tokyo" },
              ];
    });

    const [showAdd, setShowAdd] = useState(false);
    const [customLabel, setCustomLabel] = useState("");
    const [customTz, setCustomTz] = useState("");
    const [customError, setCustomError] = useState("");

    useEffect(() => {
        const i = setInterval(() => {}, 10000);
        return () => clearInterval(i);
    }, []);

    useEffect(() => {
        localStorage.setItem("dashboard_timezones", JSON.stringify(zones));
    }, [zones]);

    const isValidTz = (tz: string): boolean => {
        try {
            formatInTimeZone(new Date(), tz, "HH:mm");
            return true;
        } catch {
            return false;
        }
    };

    const addCustomZone = () => {
        const tz = customTz.trim();
        if (!tz) return setCustomError("Invalid");
        if (!isValidTz(tz)) return setCustomError("Invalid TZ");
        if (zones.find((z) => z.tz === tz)) return setCustomError("Duplicate");

        const label =
            customLabel.trim() || tz.split("/").pop()?.replace(/_/g, " ") || tz;

        setZones([...zones, { label, tz }]);
        setCustomLabel("");
        setCustomTz("");
        setCustomError("");
        setShowAdd(false);
    };

    const addZone = (zone: TimeZone) => {
        if (!zones.find((z) => z.tz === zone.tz)) {
            setZones([...zones, zone]);
        }
        setShowAdd(false);
    };

    const removeZone = (tz: string) =>
        setZones(zones.filter((z) => z.tz !== tz));

    const localTime = formatInTimeZone(
        new Date(),
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        "HH:mm"
    );

    const rawZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const localZone = rawZone.split("/").pop()?.replace(/_/g, " ");
    const tzAbbr = formatInTimeZone(new Date(), rawZone, "zzz");

    return (
        <Card className="rounded-2xl">
            <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Timezones
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Add timezone"
                        onClick={() => setShowAdd(!showAdd)}
                    >
                        <Plus size={14} />
                    </Button>
                </div>

                <div>
                    <p className="text-2xl font-black tabular-nums">
                        {localTime}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {localZone} ({tzAbbr})
                    </p>
                </div>

                <Separator />

                <div className="space-y-2">
                    {zones.map((z) => (
                        <div
                            key={z.tz}
                            className="flex items-center justify-between"
                        >
                            <div>
                                <p className="text-lg font-bold tabular-nums">
                                    {getTime(z.tz)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {z.label} {getOffset(z.tz)}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Remove timezone"
                                onClick={() => removeZone(z.tz)}
                            >
                                <X size={12} />
                            </Button>
                        </div>
                    ))}
                </div>

                {showAdd && (
                    <div className="space-y-2 pt-2">
                        <Input
                            value={customLabel}
                            onChange={(e) => setCustomLabel(e.target.value)}
                            placeholder="Label"
                        />
                        <Input
                            value={customTz}
                            onChange={(e) => {
                                setCustomTz(e.target.value);
                                setCustomError("");
                            }}
                            placeholder="Timezone (e.g. Asia/Kolkata)"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") addCustomZone();
                            }}
                        />

                        {customError && (
                            <p className="text-xs text-red-500">
                                {customError}
                            </p>
                        )}

                        <Button onClick={addCustomZone} className="w-full transition-colors">
                            Add
                        </Button>

                        <Separator />

                        <div className="max-h-60 space-y-1 overflow-auto">
                            {POPULAR_ZONES.filter(
                                (z) => !zones.find((e) => e.tz === z.tz)
                            ).map((z) => (
                                <Button
                                    key={z.tz}
                                    variant="ghost"
                                    className="w-full justify-between transition-colors"
                                    onClick={() => addZone(z)}
                                >
                                    <span>{z.label}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {getTime(z.tz)}
                                    </span>
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
