import { useState, useRef } from "react";
import { z } from "zod";
import { useForm } from "@tanstack/react-form";
import { Loader2, ChevronDownIcon } from "lucide-react";
import { useNominatimSearch } from "../../hooks/use-places";
import { Calendar } from "@/components/ui/calendar";
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Field,
    FieldContent,
    FieldError,
    FieldLabel,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Doc } from "@backend/dataModel";

const placeSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string(),
    address: z.string(),
    lat: z.string(),
    lng: z.string(),
    osmId: z.string(),
});

type PlaceFormValues = z.infer<typeof placeSchema>;

const DEFAULT_VALUES: PlaceFormValues = {
    name: "",
    description: "",
    address: "",
    lat: "",
    lng: "",
    osmId: "",
};

export interface PlaceFormOutput {
    name: string;
    description?: string;
    address?: string;
    lat?: number;
    lng?: number;
    placeTime?: number;
    endTime?: number;
    osmId?: string;
}

interface PlaceFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: PlaceFormOutput) => void;
    place?: Doc<"place"> | null;
    prefillCoords?: {
        lat: number;
        lng: number;
        name?: string;
        address?: string;
    } | null;
    isSaving?: boolean;
}

export function PlaceFormDialog({
    open,
    onOpenChange,
    onSave,
    place,
    prefillCoords,
    isSaving = false,
}: PlaceFormDialogProps) {
    const {
        results: searchResults,
        isSearching,
        search: performSearch,
        clear: clearSearch,
    } = useNominatimSearch();
    const [searchQuery, setSearchQuery] = useState("");
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

    const now = new Date();
    const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
    const [timeFrom, setTimeFrom] = useState(nowTime);
    const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
    const [timeTo, setTimeTo] = useState(nowTime);
    const [openFromCal, setOpenFromCal] = useState(false);
    const [openToCal, setOpenToCal] = useState(false);

    const isEditing = !!place;

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!value.trim()) {
            clearSearch();
            return;
        }
        debounceRef.current = setTimeout(() => {
            performSearch(value);
        }, 400);
    };

    const form = useForm({
        defaultValues: DEFAULT_VALUES,
        onSubmit: ({ value }) => {
            const parsed = placeSchema.safeParse(value);
            if (!parsed.success) return;

            const v = parsed.data;
            const lat = v.lat ? parseFloat(v.lat) : undefined;
            const lng = v.lng ? parseFloat(v.lng) : undefined;

            const buildTimestamp = (
                date: Date | undefined,
                time: string
            ): number | undefined => {
                if (!date && !time) return undefined;
                const base = date ? new Date(date) : new Date();
                if (time && time.length >= 5) {
                    const [h, m] = time.split(":").map(Number);
                    base.setHours(h, m, 0, 0);
                } else {
                    base.setHours(0, 0, 0, 0);
                }
                return base.getTime();
            };

            onSave({
                name: v.name.trim(),
                description: v.description.trim() || undefined,
                address: v.address.trim() || undefined,
                lat: lat && !isNaN(lat) ? lat : undefined,
                lng: lng && !isNaN(lng) ? lng : undefined,
                placeTime:
                    dateFrom || timeFrom
                        ? buildTimestamp(dateFrom, timeFrom)
                        : undefined,
                endTime:
                    dateTo || timeTo
                        ? buildTimestamp(dateTo, timeTo)
                        : undefined,
                osmId: v.osmId || undefined,
            });
        },
    });

    const handleOpenChange = (v: boolean) => {
        if (v && place) {
            form.reset();
            form.setFieldValue("name", place.name);
            form.setFieldValue("description", place.description ?? "");
            form.setFieldValue("address", place.address ?? "");
            form.setFieldValue("lat", place.lat?.toString() ?? "");
            form.setFieldValue("lng", place.lng?.toString() ?? "");
            form.setFieldValue("osmId", place.osmId ?? "");
            if (place.placeTime) {
                const d = new Date(place.placeTime);
                setDateFrom(d);
                setTimeFrom(
                    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
                );
            } else {
                setDateFrom(undefined);
                setTimeFrom("");
            }
            if (place.endTime) {
                const d = new Date(place.endTime);
                setDateTo(d);
                setTimeTo(
                    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
                );
            } else {
                setDateTo(undefined);
                setTimeTo("");
            }
        } else if (v && prefillCoords) {
            form.reset();
            form.setFieldValue("name", prefillCoords.name ?? "");
            form.setFieldValue("address", prefillCoords.address ?? "");
            form.setFieldValue("lat", String(prefillCoords.lat));
            form.setFieldValue("lng", String(prefillCoords.lng));
            setDateFrom(undefined);
            setTimeFrom(nowTime);
            setDateTo(undefined);
            setTimeTo(nowTime);
        } else if (v) {
            form.reset();
            setDateFrom(undefined);
            setTimeFrom(nowTime);
            setDateTo(undefined);
            setTimeTo(nowTime);
        }
        if (!v) {
            setSearchQuery("");
            clearSearch();
        }
        onOpenChange(v);
    };

    const handleSelectResult = (result: (typeof searchResults)[0]) => {
        form.setFieldValue("name", result.name || form.getFieldValue("name"));
        form.setFieldValue(
            "address",
            result.address || form.getFieldValue("address")
        );
        if (result.lat != null) form.setFieldValue("lat", String(result.lat));
        if (result.lng != null) form.setFieldValue("lng", String(result.lng));
        if (result.osmId) form.setFieldValue("osmId", result.osmId);
        setSearchQuery("");
        clearSearch();
    };

    const timeError =
        dateFrom &&
        dateTo &&
        timeFrom &&
        timeTo &&
        dateFrom.toDateString() === dateTo.toDateString() &&
        timeTo <= timeFrom;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-h-85vh sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Edit place" : "Add place"}
                    </DialogTitle>
                </DialogHeader>

                <div className="overflow-y-auto pr-4">
                    <div className="space-y-4 pb-2">
                        <div className="relative">
                            <Command
                                shouldFilter={false}
                                className="bg-transparent p-0"
                            >
                                <CommandInput
                                    placeholder="Search for a place..."
                                    value={searchQuery}
                                    onValueChange={handleSearchChange}
                                />
                            </Command>
                            {(isSearching ||
                                searchResults.length > 0 ||
                                (searchQuery && !isSearching)) && (
                                <div className="absolute top-full right-0 left-0 z-50 mt-1 rounded-lg border bg-popover shadow-md">
                                    <Command shouldFilter={false}>
                                        <CommandList>
                                            {isSearching && (
                                                <div className="flex items-center justify-center py-4">
                                                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                                                </div>
                                            )}
                                            {!isSearching &&
                                                searchQuery &&
                                                searchResults.length === 0 && (
                                                    <CommandEmpty>
                                                        No results found
                                                    </CommandEmpty>
                                                )}
                                            {searchResults.length > 0 && (
                                                <CommandGroup>
                                                    {searchResults.map(
                                                        (result, i) => (
                                                            <CommandItem
                                                                key={i}
                                                                onSelect={() =>
                                                                    handleSelectResult(
                                                                        result
                                                                    )
                                                                }
                                                                className="flex flex-col items-start gap-0.5"
                                                            >
                                                                <span className="text-xs font-medium">
                                                                    {
                                                                        result.name
                                                                    }
                                                                </span>
                                                                <span className="truncate text-xs text-muted-foreground">
                                                                    {
                                                                        result.address
                                                                    }
                                                                </span>
                                                            </CommandItem>
                                                        )
                                                    )}
                                                </CommandGroup>
                                            )}
                                        </CommandList>
                                    </Command>
                                </div>
                            )}
                        </div>

                        <form.Field name="name">
                            {(field) => {
                                const result = placeSchema.shape.name.safeParse(
                                    field.state.value
                                );
                                return (
                                    <Field>
                                        <FieldLabel>Name *</FieldLabel>
                                        <FieldContent>
                                            <Input
                                                value={field.state.value}
                                                onChange={(e) =>
                                                    field.handleChange(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Place name"
                                            />
                                        </FieldContent>
                                        {!result.success && (
                                            <FieldError>
                                                Name is required
                                            </FieldError>
                                        )}
                                    </Field>
                                );
                            }}
                        </form.Field>

                        <form.Field name="description">
                            {(field) => (
                                <Field>
                                    <FieldLabel>Description</FieldLabel>
                                    <FieldContent>
                                        <Textarea
                                            value={field.state.value}
                                            onChange={(e) =>
                                                field.handleChange(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Optional description..."
                                            rows={2}
                                            className="resize-none"
                                        />
                                    </FieldContent>
                                </Field>
                            )}
                        </form.Field>

                        <form.Field name="address">
                            {(field) => (
                                <Field>
                                    <FieldLabel>Address</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            value={field.state.value}
                                            onChange={(e) =>
                                                field.handleChange(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Street, city..."
                                        />
                                    </FieldContent>
                                </Field>
                            )}
                        </form.Field>

                        <div className="grid grid-cols-2 gap-3">
                            <form.Field name="lat">
                                {(field) => (
                                    <Field>
                                        <FieldLabel>Latitude</FieldLabel>
                                        <FieldContent>
                                            <Input
                                                type="number"
                                                step="any"
                                                value={field.state.value}
                                                onChange={(e) =>
                                                    field.handleChange(
                                                        e.target.value
                                                    )
                                                }
                                                onPaste={(e) => {
                                                    const text = e.clipboardData
                                                        .getData("text")
                                                        .trim();
                                                    const match = text.match(
                                                        /^(-?\d+\.?\d*)\s*[,;\s]\s*(-?\d+\.?\d*)$/
                                                    );
                                                    if (match) {
                                                        e.preventDefault();
                                                        field.handleChange(
                                                            match[1]
                                                        );
                                                        form.setFieldValue(
                                                            "lng",
                                                            match[2]
                                                        );
                                                    }
                                                }}
                                                placeholder="Latitude"
                                            />
                                        </FieldContent>
                                    </Field>
                                )}
                            </form.Field>

                            <form.Field name="lng">
                                {(field) => (
                                    <Field>
                                        <FieldLabel>Longitude</FieldLabel>
                                        <FieldContent>
                                            <Input
                                                type="number"
                                                step="any"
                                                value={field.state.value}
                                                onChange={(e) =>
                                                    field.handleChange(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Longitude"
                                            />
                                        </FieldContent>
                                    </Field>
                                )}
                            </form.Field>
                        </div>

                        <div className="flex gap-3">
                            <div className="flex flex-1 flex-col gap-1.5">
                                <Label className="px-1 text-xs">
                                    Start date
                                </Label>
                                <Popover
                                    open={openFromCal}
                                    onOpenChange={setOpenFromCal}
                                >
                                    <PopoverTrigger
                                        render={
                                            <Button
                                                variant="outline"
                                                className="w-full justify-between text-xs font-normal"
                                            />
                                        }
                                    >
                                        {dateFrom
                                            ? dateFrom.toLocaleDateString(
                                                  "en-US",
                                                  {
                                                      day: "2-digit",
                                                      month: "short",
                                                      year: "numeric",
                                                  }
                                              )
                                            : "Pick a date"}
                                        <ChevronDownIcon className="size-3.5" />
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto overflow-hidden p-0"
                                        align="start"
                                    >
                                        <Calendar
                                            mode="single"
                                            selected={dateFrom}
                                            onSelect={(date) => {
                                                setDateFrom(date);
                                                setOpenFromCal(false);
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label className="invisible px-1 text-xs">
                                    Time
                                </Label>
                                <Input
                                    type="time"
                                    value={timeFrom}
                                    onChange={(e) =>
                                        setTimeFrom(e.target.value)
                                    }
                                    className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="flex flex-1 flex-col gap-1.5">
                                <Label className="px-1 text-xs">End date</Label>
                                <Popover
                                    open={openToCal}
                                    onOpenChange={setOpenToCal}
                                >
                                    <PopoverTrigger
                                        render={
                                            <Button
                                                variant="outline"
                                                className="w-full justify-between text-xs font-normal"
                                            />
                                        }
                                    >
                                        {dateTo
                                            ? dateTo.toLocaleDateString(
                                                  "en-US",
                                                  {
                                                      day: "2-digit",
                                                      month: "short",
                                                      year: "numeric",
                                                  }
                                              )
                                            : "Pick a date"}
                                        <ChevronDownIcon className="size-3.5" />
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto overflow-hidden p-0"
                                        align="start"
                                    >
                                        <Calendar
                                            mode="single"
                                            selected={dateTo}
                                            onSelect={(date) => {
                                                setDateTo(date);
                                                setOpenToCal(false);
                                            }}
                                            disabled={
                                                dateFrom
                                                    ? { before: dateFrom }
                                                    : undefined
                                            }
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label className="invisible px-1 text-xs">
                                    Time
                                </Label>
                                <Input
                                    type="time"
                                    value={timeTo}
                                    onChange={(e) => setTimeTo(e.target.value)}
                                    className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                />
                            </div>
                        </div>

                        {timeError && (
                            <Alert variant="destructive" className="py-2">
                                <AlertDescription className="text-xs">
                                    End time must be after start time
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        className={"flex-1"}
                        onClick={() => handleOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        className={"flex-1"}
                        onClick={form.handleSubmit}
                        disabled={
                            isSaving || form.state.isSubmitting || !!timeError
                        }
                    >
                        {isSaving || form.state.isSubmitting ? (
                            <>
                                <Loader2 className="mr-1 size-3.5 animate-spin" />
                                Saving...
                            </>
                        ) : isEditing ? (
                            "Update"
                        ) : (
                            "Add place"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
