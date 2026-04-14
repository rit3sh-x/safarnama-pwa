import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const PRESET_COLORS = [
    { value: "#000000", className: "bg-[#000000]" },
    { value: "#434343", className: "bg-[#434343]" },
    { value: "#666666", className: "bg-[#666666]" },
    { value: "#999999", className: "bg-[#999999]" },
    { value: "#cccccc", className: "bg-[#cccccc]" },
    { value: "#efefef", className: "bg-[#efefef]" },
    { value: "#ffffff", className: "bg-[#ffffff]" },
    { value: "#e74c3c", className: "bg-[#e74c3c]" },
    { value: "#e67e22", className: "bg-[#e67e22]" },
    { value: "#f1c40f", className: "bg-[#f1c40f]" },
    { value: "#2ecc71", className: "bg-[#2ecc71]" },
    { value: "#1abc9c", className: "bg-[#1abc9c]" },
    { value: "#3498db", className: "bg-[#3498db]" },
    { value: "#9b59b6", className: "bg-[#9b59b6]" },
    { value: "#c0392b", className: "bg-[#c0392b]" },
    { value: "#d35400", className: "bg-[#d35400]" },
    { value: "#f39c12", className: "bg-[#f39c12]" },
    { value: "#27ae60", className: "bg-[#27ae60]" },
    { value: "#16a085", className: "bg-[#16a085]" },
    { value: "#2980b9", className: "bg-[#2980b9]" },
    { value: "#8e44ad", className: "bg-[#8e44ad]" },
] as const;

function normalizeColor(color: string | undefined | null): string | null {
    if (!color) return null;

    const raw = color.trim().toLowerCase();

    if (raw.startsWith("#")) {
        if (raw.length === 4) {
            const r = raw[1];
            const g = raw[2];
            const b = raw[3];
            return `#${r}${r}${g}${g}${b}${b}`;
        }
        return raw;
    }

    const rgb = raw.match(
        /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+)?\s*\)$/
    );
    if (!rgb) return raw;

    const toHex = (n: number) =>
        Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
    const r = Number.parseInt(rgb[1] ?? "0", 10);
    const g = Number.parseInt(rgb[2] ?? "0", 10);
    const b = Number.parseInt(rgb[3] ?? "0", 10);

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

interface ColorPickerProps {
    /** The color currently applied at the editor's selection. Undefined when none. */
    value?: string;
    onChange: (color: string) => void;
    icon: LucideIcon;
    label: string;
}

export function ColorPicker({
    value,
    onChange,
    icon: Icon,
    label,
}: ColorPickerProps) {
    // Normalize whatever the editor reports (may be hex, rgb(), or undefined).
    const appliedColor = normalizeColor(value);

    // Remember the user's last explicit choice — used as a soft "preference"
    // indicator when the caret isn't over a colored span.
    const [lastPicked, setLastPicked] = useState<string | null>(null);

    // The button that gets the ring: prefer what's actually applied at the
    // caret; fall back to the user's last pick; otherwise nothing is active.
    const activeColor = appliedColor ?? lastPicked;

    // The tiny bar under the icon mirrors the same priority but has a visual
    // default so the trigger always renders a sensible indicator.
    const indicatorClassName = useMemo(() => {
        const color = activeColor;
        const match = PRESET_COLORS.find((c) => c.value === color);
        return match?.className ?? "bg-transparent";
    }, [activeColor]);

    const handlePick = (color: string) => {
        setLastPicked(color);
        onChange(color);
    };

    return (
        <Popover>
            <PopoverTrigger className="flex h-8 min-w-8 flex-col items-center justify-center rounded-md transition-colors hover:bg-muted">
                <Icon className="size-4" />
                <div
                    className={cn(
                        "h-0.5 w-3.5 rounded-full",
                        indicatorClassName
                    )}
                />
            </PopoverTrigger>
            <PopoverContent
                className="w-auto gap-2 p-3"
                align="start"
                sideOffset={8}
            >
                <p className="text-xs font-medium text-muted-foreground">
                    {label}
                </p>
                <div className="grid grid-cols-7 gap-1.5">
                    {PRESET_COLORS.map((color) => {
                        const isActive = activeColor === color.value;
                        return (
                            <Button
                                key={color.value}
                                type="button"
                                aria-label={color.value}
                                aria-pressed={isActive}
                                onClick={() => handlePick(color.value)}
                                className={cn(
                                    "size-6 rounded-md border border-border transition-transform hover:scale-110",
                                    color.className,
                                    isActive && "ring-2 ring-ring ring-offset-1"
                                )}
                            />
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
}
