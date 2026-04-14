import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Combobox,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
    ComboboxContent,
} from "@/components/ui/combobox";
import { TIMEZONE_KEY } from "../../constants";
import { formatInTimeZone } from "date-fns-tz";
import { useSettings } from "@/modules/settings/hooks/use-settings";

interface TimeZone {
    label: string;
    value: string;
}

const ALL_ZONES: TimeZone[] = [
    { label: "New York", value: "America/New_York" },
    { label: "Los Angeles", value: "America/Los_Angeles" },
    { label: "Chicago", value: "America/Chicago" },
    { label: "Toronto", value: "America/Toronto" },
    { label: "São Paulo", value: "America/Sao_Paulo" },
    { label: "London", value: "Europe/London" },
    { label: "Berlin", value: "Europe/Berlin" },
    { label: "Paris", value: "Europe/Paris" },
    { label: "Moscow", value: "Europe/Moscow" },
    { label: "Istanbul", value: "Europe/Istanbul" },
    { label: "Dubai", value: "Asia/Dubai" },
    { label: "Mumbai", value: "Asia/Kolkata" },
    { label: "Bangkok", value: "Asia/Bangkok" },
    { label: "Singapore", value: "Asia/Singapore" },
    { label: "Shanghai", value: "Asia/Shanghai" },
    { label: "Tokyo", value: "Asia/Tokyo" },
    { label: "Seoul", value: "Asia/Seoul" },
    { label: "Sydney", value: "Australia/Sydney" },
    { label: "Auckland", value: "Pacific/Auckland" },
    { label: "Honolulu", value: "Pacific/Honolulu" },
];

function getOffset(tz: string): string {
    try {
        return formatInTimeZone(new Date(), tz, "XXX");
    } catch {
        return "";
    }
}

export default function TimezoneWidget() {
    const [zones, setZones] = useState<TimeZone[]>(() => {
        const saved = localStorage.getItem(TIMEZONE_KEY);
        return saved
            ? JSON.parse(saved)
            : [
                  { label: "New York", value: "America/New_York" },
                  { label: "Tokyo", value: "Asia/Tokyo" },
              ];
    });
    const { timeFormat } = useSettings();
    const timePattern = timeFormat === "12h" ? "h:mm a" : "HH:mm";

    const [showAdd, setShowAdd] = useState(false);

    useEffect(() => {
        const i = setInterval(() => {}, 10000);
        return () => clearInterval(i);
    }, []);

    useEffect(() => {
        localStorage.setItem(TIMEZONE_KEY, JSON.stringify(zones));
    }, [zones]);

    const addZone = (zone: TimeZone | null) => {
        if (zone && !zones.find((z) => z.value === zone.value)) {
            setZones([...zones, zone]);
        }
        setShowAdd(false);
    };

    const removeZone = (tz: string) =>
        setZones(zones.filter((z) => z.value !== tz));

    const availableZones = ALL_ZONES.filter(
        (z) => !zones.find((e) => e.value === z.value)
    );

    const localTime = formatInTimeZone(
        new Date(),
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        timePattern
    );

    const rawZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const localZone = rawZone.split("/").pop()?.replace(/_/g, " ");
    const tzAbbr = formatInTimeZone(new Date(), rawZone, "zzz");

    return (
        <Card className="rounded-2xl">
            <CardContent className="space-y-3">
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

                {showAdd && availableZones.length > 0 && (
                    <Combobox
                        items={availableZones}
                        onValueChange={(val) => addZone(val as TimeZone | null)}
                    >
                        <ComboboxInput
                            placeholder="Search timezone..."
                            showTrigger={false}
                            showClear={false}
                        />
                        <ComboboxContent>
                            <ComboboxEmpty>No timezone found</ComboboxEmpty>
                            <ComboboxList>
                                {(item: TimeZone) => (
                                    <ComboboxItem
                                        key={item.value}
                                        value={item}
                                        className="justify-between"
                                    >
                                        <span>{item.label}</span>
                                        <span className="text-xs text-muted-foreground tabular-nums">
                                            {formatInTimeZone(
                                                new Date(),
                                                item.value,
                                                timePattern
                                            )}
                                        </span>
                                    </ComboboxItem>
                                )}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                )}

                {zones.length > 0 && (
                    <>
                        <Separator />
                        <div className="space-y-2">
                            {zones.map((z) => (
                                <div
                                    key={z.value}
                                    className="flex items-center justify-between"
                                >
                                    <div>
                                        <p className="text-lg font-bold tabular-nums">
                                            {formatInTimeZone(
                                                new Date(),
                                                z.value,
                                                timePattern
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {z.label} {getOffset(z.value)}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Remove timezone"
                                        onClick={() => removeZone(z.value)}
                                    >
                                        <X size={12} />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
