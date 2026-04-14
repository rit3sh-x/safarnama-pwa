import { useState, useRef, useEffect } from "react";
import { z } from "zod";
import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useNominatimSearch } from "../../hooks/use-places";
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from "@/components/ui/command";
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
import { Textarea } from "@/components/ui/textarea";
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

            onSave({
                name: v.name.trim(),
                description: v.description.trim() || undefined,
                address: v.address.trim() || undefined,
                lat: lat && !isNaN(lat) ? lat : undefined,
                lng: lng && !isNaN(lng) ? lng : undefined,
                osmId: v.osmId || undefined,
            });
        },
    });

    const prevOpenRef = useRef(false);
    useEffect(() => {
        if (open && !prevOpenRef.current) {
            if (place) {
                form.reset();
                form.setFieldValue("name", place.name);
                form.setFieldValue("description", place.description ?? "");
                form.setFieldValue("address", place.address ?? "");
                form.setFieldValue("lat", place.lat?.toString() ?? "");
                form.setFieldValue("lng", place.lng?.toString() ?? "");
                form.setFieldValue("osmId", place.osmId ?? "");
            } else if (prefillCoords) {
                form.reset();
                form.setFieldValue("name", prefillCoords.name ?? "");
                form.setFieldValue("address", prefillCoords.address ?? "");
                form.setFieldValue("lat", String(prefillCoords.lat));
                form.setFieldValue("lng", String(prefillCoords.lng));
            } else {
                form.reset();
            }
        }
        prevOpenRef.current = open;
    }, [open, place, prefillCoords, form]);

    const handleOpenChange = (v: boolean) => {
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
                                                                className="flex w-full min-w-0 flex-col items-start gap-1"
                                                            >
                                                                <span
                                                                    className="block w-full truncate text-xs font-medium"
                                                                    title={
                                                                        result.name
                                                                    }
                                                                >
                                                                    {
                                                                        result.name
                                                                    }
                                                                </span>
                                                                <span
                                                                    className="block w-full truncate text-xs text-muted-foreground"
                                                                    title={
                                                                        result.address
                                                                    }
                                                                >
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
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="flex-1"
                        onClick={form.handleSubmit}
                        disabled={isSaving || form.state.isSubmitting}
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
