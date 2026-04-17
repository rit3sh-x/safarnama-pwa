import { z } from "zod";
import { useForm } from "@tanstack/react-form";
import { useCallback, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { CameraIcon, ChevronLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { changeUsername } from "../../hooks/auth-handlers";
import { useUploadFileToConvex } from "@/lib/utils";
import { AuthContainer } from "./elements";
import { MAX_FILE_SIZE } from "@/lib/constants";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldLabel,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const schema = z.object({
    username: z
        .string()
        .min(3, "At least 3 characters")
        .max(20, "Max 20 characters")
        .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscores only"),
});

export function UsernameForm() {
    const [croppedPreview, setCroppedPreview] = useState<string | null>(null);
    const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);
    const [cropSrc, setCropSrc] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadFile = useUploadFileToConvex();

    const view: "form" | "crop" = cropSrc ? "crop" : "form";

    const form = useForm({
        defaultValues: {
            username: "",
        },
        onSubmit: async ({ value }) => {
            const parsed = schema.safeParse(value);
            if (!parsed.success) return;

            setImageError(null);
            try {
                let imageUrl: string | undefined;

                if (croppedBlob) {
                    if (croppedBlob.size > MAX_FILE_SIZE) {
                        setImageError("Image must be under 1 MB");
                        return;
                    }

                    const file = new File([croppedBlob], "avatar.jpg", {
                        type: "image/jpeg",
                    });
                    const { url } = await uploadFile(file);
                    imageUrl = url ?? undefined;
                }

                await changeUsername({
                    username: parsed.data.username,
                    imageUrl,
                    fetchOptions: {
                        onError: ({ error }) => console.error(error),
                    },
                });
            } catch (error) {
                console.error("Submit failed:", error);
            }
        },
    });

    const startCrop = useCallback((file: File) => {
        setImageError(null);
        const url = URL.createObjectURL(file);
        setCropSrc(url);
    }, []);

    const applyCrop = useCallback(
        (blob: Blob) => {
            if (croppedPreview) URL.revokeObjectURL(croppedPreview);
            setCroppedBlob(blob);
            setCroppedPreview(URL.createObjectURL(blob));
            if (cropSrc) URL.revokeObjectURL(cropSrc);
            setCropSrc(null);
        },
        [croppedPreview, cropSrc]
    );

    const cancelCrop = useCallback(() => {
        if (cropSrc) URL.revokeObjectURL(cropSrc);
        setCropSrc(null);
    }, [cropSrc]);

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        setImageError(null);
        const file = e.target.files?.[0];
        if (file) startCrop(file);
        e.target.value = "";
    };

    if (view === "crop" && cropSrc) {
        return (
            <AuthContainer
                title="Crop your photo"
                subtitle="Drag to reposition. Use the slider to zoom in."
            >
                <CropView
                    src={cropSrc}
                    onApply={applyCrop}
                    onCancel={cancelCrop}
                />
            </AuthContainer>
        );
    }

    return (
        <AuthContainer
            title="Pick a username"
            subtitle="This is how others will find you"
        >
            <div className="flex flex-col gap-4">
                <div className="mb-2 flex flex-col items-center">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                            "flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 bg-muted",
                            imageError ? "border-destructive" : "border-border"
                        )}
                    >
                        {croppedPreview ? (
                            <img
                                src={croppedPreview}
                                alt="Avatar preview"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <CameraIcon className="size-8 text-muted-foreground" />
                        )}
                    </button>

                    <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={onFileSelect}
                        className="hidden"
                    />

                    <p className="mt-2 text-sm text-muted-foreground">
                        Add a photo (optional)
                    </p>

                    {imageError && (
                        <p className="mt-1 text-center text-sm text-destructive">
                            {imageError}
                        </p>
                    )}
                </div>

                <form.Field name="username">
                    {(field) => {
                        const touched = field.state.meta.isTouched;
                        const result = schema.shape.username.safeParse(
                            field.state.value
                        );

                        return (
                            <Field>
                                <FieldLabel>Username</FieldLabel>

                                <FieldContent>
                                    <Input
                                        value={field.state.value}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        onBlur={field.handleBlur}
                                        placeholder="e.g. cool_user42"
                                        type="text"
                                        autoComplete="off"
                                    />
                                </FieldContent>

                                <FieldDescription>
                                    3-20 characters, letters, numbers,
                                    underscores
                                </FieldDescription>

                                {touched &&
                                    !result.success &&
                                    field.state.value.length > 0 && (
                                        <FieldError>
                                            {result.error.issues[0]?.message}
                                        </FieldError>
                                    )}
                            </Field>
                        );
                    }}
                </form.Field>

                <Button
                    onClick={form.handleSubmit}
                    disabled={form.state.isSubmitting}
                    size={"lg"}
                    className={"mt-2 rounded-lg"}
                >
                    {form.state.isSubmitting ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        "Save"
                    )}
                </Button>
            </div>
        </AuthContainer>
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
        <div className="flex flex-col gap-4">
            <div className="relative mx-auto aspect-square w-full max-w-sm touch-none overflow-hidden rounded-2xl border bg-muted">
                <Cropper
                    image={src}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
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
                        setZoom(Array.isArray(value) ? (value[0] ?? 1) : value)
                    }
                    min={1}
                    max={3}
                    step={0.01}
                />
            </div>

            <div className="flex gap-3">
                <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={onCancel}
                    disabled={working}
                >
                    <ChevronLeft className="size-4" />
                    Back
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
            </div>
        </div>
    );
}
