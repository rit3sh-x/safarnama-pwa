import { useCallback, useMemo, useRef, useState } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import Cropper, { type Area } from "react-easy-crop";
import { z } from "zod";
import {
    CalendarDays,
    Camera,
    ChevronLeft,
    ImagePlus,
    Loader2,
    Trash2,
    X,
} from "lucide-react";
import type { DateRange } from "react-day-picker";
import type { Id } from "@backend/dataModel";
import type { Id as IdAuth, Doc } from "@backend/authDataModel";

import {
    Credenza,
    CredenzaBody,
    CredenzaClose,
    CredenzaContent,
    CredenzaDescription,
    CredenzaFooter,
    CredenzaHeader,
    CredenzaTitle,
} from "@/components/ui/credenza";
import {
    Field,
    FieldContent,
    FieldError,
    FieldLabel,
} from "@/components/ui/field";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { cn, useUploadFileToConvex } from "@/lib/utils";
import { useCreateTrip } from "../../hooks/use-trips";

const titleSchema = z
    .string()
    .min(1, "Title is required")
    .max(100, "Title is too long");
const destinationSchema = z
    .string()
    .min(1, "Destination is required")
    .max(100, "Destination is too long");
const descriptionSchema = z
    .string()
    .max(500, "Description is too long")
    .optional();

const baseSchema = z.object({
    title: titleSchema,
    destination: destinationSchema,
    description: descriptionSchema,
    isPublic: z.boolean(),
    dateRange: z
        .object({
            from: z.date().optional(),
            to: z.date().optional(),
        })
        .optional(),
});

const schema = baseSchema.superRefine((data, ctx) => {
    if (!data.isPublic) return;
    if (!data.description?.trim()) {
        ctx.addIssue({
            code: "custom",
            path: ["description"],
            message: "Description is required for public trips.",
        });
    }
    if (!data.dateRange?.from || !data.dateRange?.to) {
        ctx.addIssue({
            code: "custom",
            path: ["dateRange"],
            message: "Start and end dates are required for public trips.",
        });
    }
});

type FormValues = {
    title: string;
    destination: string;
    description: string;
    isPublic: boolean;
    dateRange: DateRange | undefined;
};

interface CreateTripDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated?: (data: {
        tripId: Id<"trip">;
        orgId: IdAuth<"organization">;
        name: string;
        logo?: string;
        role: Doc<"member">["role"];
    }) => void;
}

const formatDateLabel = (date: Date) =>
    date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

export function CreateTripDialog({
    open,
    onOpenChange,
    onCreated,
}: CreateTripDialogProps) {
    const { mutate: createTrip, isPending: isCreating } = useCreateTrip();
    const uploadFile = useUploadFileToConvex();

    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isUploadingCover, setIsUploadingCover] = useState(false);

    const view: "form" | "crop" = cropSrc ? "crop" : "form";

    const form = useForm({
        defaultValues: {
            title: "",
            destination: "",
            description: "",
            isPublic: false,
            dateRange: undefined as DateRange | undefined,
        } as FormValues,
        onSubmit: async ({ value }) => {
            const parsed = schema.safeParse(value);
            if (!parsed.success) return;

            setSubmitError(null);

            try {
                const logoUrl = await uploadCoverImage();
                const { tripId, orgId } = await createTrip({
                    title: parsed.data.title.trim(),
                    destination: parsed.data.destination.trim(),
                    description: parsed.data.description?.trim() || undefined,
                    logoUrl,
                    isPublic: parsed.data.isPublic,
                    startDate: parsed.data.dateRange?.from?.getTime(),
                    endDate: parsed.data.dateRange?.to?.getTime(),
                });

                resetAll();
                onOpenChange(false);
                onCreated?.({
                    tripId,
                    orgId,
                    logo: logoUrl,
                    name: parsed.data.title.trim(),
                    role: "owner",
                });
            } catch (error) {
                console.error("Failed to create trip:", error);
                setSubmitError("Something went wrong. Please try again.");
            }
        },
    });

    const isPublic = useStore(form.store, (s) => s.values.isPublic);
    const formValues = useStore(form.store, (s) => s.values);

    const crossFieldErrors = useMemo(() => {
        const parsed = schema.safeParse(formValues);
        if (parsed.success) return { description: null, dateRange: null };
        return {
            description:
                parsed.error.issues.find((i) => i.path[0] === "description")
                    ?.message ?? null,
            dateRange:
                parsed.error.issues.find((i) => i.path[0] === "dateRange")
                    ?.message ?? null,
        };
    }, [formValues]);

    const resetAll = useCallback(() => {
        form.reset();
        if (coverPreview) URL.revokeObjectURL(coverPreview);
        setCoverPreview(null);
        if (cropSrc) URL.revokeObjectURL(cropSrc);
        setCropSrc(null);
        setSubmitError(null);
        setIsUploadingCover(false);
    }, [form, coverPreview, cropSrc]);

    const startCrop = useCallback((file: File) => {
        const url = URL.createObjectURL(file);
        setCropSrc(url);
    }, []);

    const applyCrop = useCallback(
        (blob: Blob) => {
            const previewUrl = URL.createObjectURL(blob);
            if (coverPreview) URL.revokeObjectURL(coverPreview);
            setCoverPreview(previewUrl);
            if (cropSrc) URL.revokeObjectURL(cropSrc);
            setCropSrc(null);
        },
        [coverPreview, cropSrc]
    );

    const cancelCrop = useCallback(() => {
        if (cropSrc) URL.revokeObjectURL(cropSrc);
        setCropSrc(null);
    }, [cropSrc]);

    const removeCover = useCallback(() => {
        if (coverPreview) URL.revokeObjectURL(coverPreview);
        setCoverPreview(null);
    }, [coverPreview]);

    async function uploadCoverImage(): Promise<string | undefined> {
        if (!coverPreview) return undefined;
        setIsUploadingCover(true);
        try {
            const response = await fetch(coverPreview);
            const blob = await response.blob();
            const file = new File([blob], "cover.jpg", { type: "image/jpeg" });
            const { url } = await uploadFile(file);
            return url ?? undefined;
        } catch (error) {
            console.error("Failed to upload cover image:", error);
            return undefined;
        } finally {
            setIsUploadingCover(false);
        }
    }

    const isSubmitting =
        form.state.isSubmitting || isCreating || isUploadingCover;

    return (
        <Credenza
            open={open}
            onOpenChange={(next) => {
                if (!next) resetAll();
                onOpenChange(next);
            }}
        >
            <CredenzaContent className="max-h-[92vh] overflow-hidden md:max-w-lg">
                {view === "form" ? (
                    <>
                        <CredenzaHeader className="pb-1">
                            <CredenzaTitle className="text-2xl tracking-tight">
                                Plan a new trip
                            </CredenzaTitle>
                            <CredenzaDescription>
                                A few details to get the journey started.
                            </CredenzaDescription>
                        </CredenzaHeader>

                        <CredenzaBody className="space-y-5 overflow-x-hidden overflow-y-auto pb-2">
                            <CoverPicker
                                preview={coverPreview}
                                onPick={startCrop}
                                onRemove={removeCover}
                            />

                            <form.Field name="title">
                                {(field) => (
                                    <ValidatedField
                                        label="Title"
                                        error={fieldError(
                                            titleSchema,
                                            field.state.value,
                                            field.state.meta.isTouched
                                        )}
                                    >
                                        <Input
                                            value={field.state.value}
                                            onChange={(e) =>
                                                field.handleChange(
                                                    e.target.value
                                                )
                                            }
                                            onBlur={field.handleBlur}
                                            placeholder="Summer in the Dolomites"
                                        />
                                    </ValidatedField>
                                )}
                            </form.Field>

                            <form.Field name="destination">
                                {(field) => (
                                    <ValidatedField
                                        label="Destination"
                                        error={fieldError(
                                            destinationSchema,
                                            field.state.value,
                                            field.state.meta.isTouched
                                        )}
                                    >
                                        <Input
                                            value={field.state.value}
                                            onChange={(e) =>
                                                field.handleChange(
                                                    e.target.value
                                                )
                                            }
                                            onBlur={field.handleBlur}
                                            placeholder="Paris, France"
                                        />
                                    </ValidatedField>
                                )}
                            </form.Field>

                            <form.Field name="description">
                                {(field) => (
                                    <ValidatedField
                                        label="Description"
                                        optional={!isPublic}
                                        required={isPublic}
                                        error={
                                            field.state.meta.isTouched
                                                ? crossFieldErrors.description
                                                : null
                                        }
                                    >
                                        <Textarea
                                            value={field.state.value}
                                            onChange={(e) =>
                                                field.handleChange(
                                                    e.target.value
                                                )
                                            }
                                            onBlur={field.handleBlur}
                                            placeholder="What's this trip about?"
                                            rows={3}
                                        />
                                    </ValidatedField>
                                )}
                            </form.Field>

                            <form.Field name="dateRange">
                                {(field) => {
                                    const dateRange = field.state.value;
                                    return (
                                        <ValidatedField
                                            label="Trip dates"
                                            optional={!isPublic}
                                            required={isPublic}
                                            error={
                                                field.state.meta.isTouched
                                                    ? crossFieldErrors.dateRange
                                                    : null
                                            }
                                        >
                                            <Popover>
                                                <div className="flex items-center gap-2">
                                                    <PopoverTrigger
                                                        render={
                                                            <Button
                                                                variant="outline"
                                                                className="flex-1 justify-start gap-2 font-normal"
                                                            />
                                                        }
                                                    >
                                                        <CalendarDays className="size-4 text-muted-foreground" />
                                                        <span className="truncate">
                                                            {dateRange?.from
                                                                ? `${formatDateLabel(dateRange.from)}${dateRange.to ? ` – ${formatDateLabel(dateRange.to)}` : ""}`
                                                                : "Pick travel dates"}
                                                        </span>
                                                    </PopoverTrigger>
                                                    {dateRange?.from && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-xs"
                                                            onClick={() =>
                                                                field.handleChange(
                                                                    undefined
                                                                )
                                                            }
                                                            aria-label="Clear dates"
                                                        >
                                                            <X className="size-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                                <PopoverContent
                                                    className="pointer-events-auto w-auto p-0"
                                                    align="start"
                                                    onPointerDown={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <Calendar
                                                        mode="range"
                                                        selected={dateRange}
                                                        onSelect={(range) => {
                                                            field.handleChange(
                                                                range
                                                            );
                                                            field.handleBlur();
                                                        }}
                                                        disabled={{
                                                            before: new Date(),
                                                        }}
                                                        numberOfMonths={1}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </ValidatedField>
                                    );
                                }}
                            </form.Field>

                            <form.Field name="isPublic">
                                {(field) => (
                                    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-muted/30 p-3">
                                        <div className="min-w-0 space-y-0.5">
                                            <Label className="text-sm">
                                                Make it public
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                Anyone with the link can view
                                                this trip.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={field.state.value}
                                            onCheckedChange={(checked) =>
                                                field.handleChange(!!checked)
                                            }
                                        />
                                    </div>
                                )}
                            </form.Field>

                            {submitError && (
                                <p className="text-center text-sm text-destructive">
                                    {submitError}
                                </p>
                            )}
                        </CredenzaBody>

                        <CredenzaFooter className="flex-row gap-3">
                            <CredenzaClose asChild>
                                <Button variant="outline" className="flex-1">
                                    Cancel
                                </Button>
                            </CredenzaClose>
                            <Button
                                className="flex-1"
                                onClick={form.handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isUploadingCover ? (
                                    <span className="inline-flex items-center gap-2">
                                        <Loader2 className="size-4 animate-spin" />
                                        Uploading
                                    </span>
                                ) : isSubmitting ? (
                                    "Creating…"
                                ) : (
                                    "Create trip"
                                )}
                            </Button>
                        </CredenzaFooter>
                    </>
                ) : (
                    <CropView
                        src={cropSrc!}
                        onApply={applyCrop}
                        onCancel={cancelCrop}
                    />
                )}
            </CredenzaContent>
        </Credenza>
    );
}

function fieldError(
    schema: z.ZodTypeAny,
    value: unknown,
    touched: boolean
): string | null {
    if (!touched) return null;
    const result = schema.safeParse(value);
    if (result.success) return null;
    return result.error.issues[0]?.message ?? null;
}

function ValidatedField({
    label,
    optional,
    required,
    error,
    children,
}: {
    label: string;
    optional?: boolean;
    required?: boolean;
    error?: string | null;
    children: React.ReactNode;
}) {
    return (
        <Field>
            <FieldLabel className="flex items-center gap-1.5">
                <span>{label}</span>
                {required && (
                    <span aria-hidden className="text-destructive">
                        *
                    </span>
                )}
                {optional && (
                    <span className="font-normal text-muted-foreground">
                        (optional)
                    </span>
                )}
            </FieldLabel>
            <FieldContent>{children}</FieldContent>
            {error && <FieldError>{error}</FieldError>}
        </Field>
    );
}

function CoverPicker({
    preview,
    onPick,
    onRemove,
}: {
    preview: string | null;
    onPick: (file: File) => void;
    onRemove: () => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="flex flex-col items-center gap-2">
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                aria-label={preview ? "Change cover photo" : "Add cover photo"}
                className={cn(
                    "group relative size-44 overflow-hidden rounded-2xl bg-muted/40 transition-all duration-300",
                    preview
                        ? "shadow-sm ring-1 ring-border hover:shadow-md"
                        : "border border-dashed border-border hover:border-primary/60 hover:bg-muted/60"
                )}
            >
                {preview ? (
                    <>
                        <img
                            src={preview}
                            alt="Trip cover"
                            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                        />
                        <div className="absolute inset-0 flex items-end justify-between gap-2 bg-linear-to-t from-black/60 via-black/10 to-transparent p-2.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                                <Camera className="size-3.5" />
                                Replace
                            </span>
                            <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove();
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onRemove();
                                    }
                                }}
                                className="inline-flex size-7 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-destructive/85"
                                aria-label="Remove cover"
                            >
                                <Trash2 className="size-3.5" />
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-muted-foreground">
                        <div className="flex size-11 items-center justify-center rounded-full bg-background/80 ring-1 ring-border transition-colors group-hover:text-primary">
                            <ImagePlus className="size-5" />
                        </div>
                        <p className="text-sm font-medium">Add a cover photo</p>
                    </div>
                )}
            </button>
            <p className="text-center text-xs text-muted-foreground">
                Square crop — shown on trip cards and previews.
            </p>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                hidden
                aria-hidden
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onPick(file);
                    e.target.value = "";
                }}
            />
        </div>
    );
}

function CropView({
    src,
    onApply,
    onCancel,
}: {
    src: string;
    onApply: (blob: Blob) => void;
    onCancel: () => void;
}) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const cropAreaRef = useRef<Area | null>(null);
    const [working, setWorking] = useState(false);

    const onCropComplete = useCallback((_: Area, area: Area) => {
        cropAreaRef.current = area;
    }, []);

    const handleApply = useCallback(async () => {
        if (!cropAreaRef.current) return;
        setWorking(true);
        try {
            const img = new Image();
            img.crossOrigin = "anonymous";
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = reject;
                img.src = src;
            });

            const { x, y, width, height } = cropAreaRef.current;
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d")!;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

            const blob = await new Promise<Blob>((resolve) =>
                canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.9)
            );
            onApply(blob);
        } finally {
            setWorking(false);
        }
    }, [src, onApply]);

    return (
        <>
            <CredenzaHeader className="pb-1">
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={onCancel}
                        aria-label="Back"
                    >
                        <ChevronLeft className="size-4" />
                    </Button>
                    <CredenzaTitle className="text-xl tracking-tight">
                        Frame your cover
                    </CredenzaTitle>
                </div>
                <CredenzaDescription>
                    Drag to reposition. Use the slider to zoom in.
                </CredenzaDescription>
            </CredenzaHeader>

            <CredenzaBody className="space-y-4 overflow-x-hidden overflow-y-auto pb-2">
                <div
                    data-vaul-no-drag
                    className="relative mx-auto aspect-square w-full max-w-sm touch-none overflow-hidden rounded-2xl border bg-muted"
                >
                    <Cropper
                        image={src}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                            Zoom
                        </Label>
                        <span className="font-mono text-xs text-muted-foreground tabular-nums">
                            {zoom.toFixed(2)}×
                        </span>
                    </div>
                    <Slider
                        value={[zoom]}
                        onValueChange={(value) =>
                            setZoom(
                                Array.isArray(value) ? (value[0] ?? 1) : value
                            )
                        }
                        min={1}
                        max={3}
                        step={0.01}
                    />
                </div>
            </CredenzaBody>

            <CredenzaFooter className="flex-row gap-3">
                <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={onCancel}
                    disabled={working}
                >
                    Cancel
                </Button>
                <Button
                    type="button"
                    className="flex-1"
                    onClick={handleApply}
                    disabled={working}
                >
                    {working ? (
                        <span className="inline-flex items-center gap-2">
                            <Loader2 className="size-4 animate-spin" />
                            Applying
                        </span>
                    ) : (
                        "Use this crop"
                    )}
                </Button>
            </CredenzaFooter>
        </>
    );
}
