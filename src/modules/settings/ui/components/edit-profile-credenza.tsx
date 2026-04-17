import { z } from "zod";
import { useForm } from "@tanstack/react-form";
import { useCallback, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { CameraIcon, ChevronLeft, Loader2Icon } from "lucide-react";
import { cn, useUploadFileToConvex, stringToHex } from "@/lib/utils";
import { MAX_FILE_SIZE } from "@/lib/constants";
import { updateProfile } from "../../hooks/use-settings-handlers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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

const schema = z.object({
    username: z
        .string()
        .min(3, "At least 3 characters")
        .max(20, "Max 20 characters")
        .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscores only"),
});

interface EditProfileCredenzaProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: {
        username: string;
        image?: string | null;
        email: string;
    };
}

export function EditProfileCredenza({
    open,
    onOpenChange,
    user,
}: EditProfileCredenzaProps) {
    const [croppedPreview, setCroppedPreview] = useState<string | null>(null);
    const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadFile = useUploadFileToConvex();

    const view: "form" | "crop" = cropSrc ? "crop" : "form";

    const form = useForm({
        defaultValues: {
            username: user.username,
        },
        onSubmit: async ({ value }) => {
            const parsed = schema.safeParse(value);
            if (!parsed.success) return;

            setImageError(null);
            setSubmitError(null);
            setIsSubmitting(true);

            try {
                let imageUrl: string | undefined;

                if (croppedBlob) {
                    if (croppedBlob.size > MAX_FILE_SIZE) {
                        setImageError("Image must be under 1 MB");
                        setIsSubmitting(false);
                        return;
                    }

                    const file = new File([croppedBlob], "avatar.jpg", {
                        type: "image/jpeg",
                    });
                    const { url } = await uploadFile(file);
                    imageUrl = url ?? undefined;
                }

                await updateProfile({
                    username: parsed.data.username,
                    imageUrl,
                    fetchOptions: {
                        onSuccess: () => {
                            resetState();
                            onOpenChange(false);
                        },
                        onError: ({ error }) => {
                            setSubmitError(
                                error instanceof Error
                                    ? error.message
                                    : "Failed to update profile"
                            );
                        },
                    },
                });
            } catch {
                setSubmitError("Failed to update profile");
            } finally {
                setIsSubmitting(false);
            }
        },
    });

    const resetState = useCallback(() => {
        if (croppedPreview) URL.revokeObjectURL(croppedPreview);
        setCroppedPreview(null);
        setCroppedBlob(null);
        setImageError(null);
        setSubmitError(null);
        if (cropSrc) URL.revokeObjectURL(cropSrc);
        setCropSrc(null);
    }, [croppedPreview, cropSrc]);

    const startCrop = useCallback((file: File) => {
        if (!file.type.startsWith("image/")) {
            setImageError("Please select an image file");
            return;
        }
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
        const file = e.target.files?.[0];
        if (file) startCrop(file);
        e.target.value = "";
    };

    const { bg: avatarBgColor } = stringToHex(user.username);
    const displayImage = croppedPreview ?? user.image;

    return (
        <Credenza
            open={open}
            onOpenChange={(next) => {
                if (!next) resetState();
                onOpenChange(next);
            }}
        >
            <CredenzaContent className="max-h-[90vh] overflow-hidden sm:max-w-md">
                {view === "form" ? (
                    <>
                        <CredenzaHeader>
                            <CredenzaTitle>Edit Profile</CredenzaTitle>
                        </CredenzaHeader>

                        <CredenzaBody className="space-y-6 overflow-y-auto">
                            <div className="flex flex-col items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    className={cn(
                                        "relative flex size-24 items-center justify-center overflow-hidden rounded-full border-2",
                                        imageError
                                            ? "border-destructive"
                                            : "border-border"
                                    )}
                                    style={
                                        !displayImage
                                            ? { backgroundColor: avatarBgColor }
                                            : undefined
                                    }
                                >
                                    {displayImage ? (
                                        <img
                                            src={displayImage}
                                            alt="Avatar"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <CameraIcon className="size-8 text-white/90" />
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100 active:opacity-100">
                                        <CameraIcon className="size-6 text-white" />
                                    </div>
                                </button>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={onFileSelect}
                                    aria-label="profile-image"
                                />

                                {imageError && (
                                    <p className="text-sm text-destructive">
                                        {imageError}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Username</Label>
                                <form.Field name="username">
                                    {(field) => (
                                        <div className="space-y-1">
                                            <Input
                                                value={field.state.value}
                                                onChange={(e) =>
                                                    field.handleChange(
                                                        e.target.value
                                                    )
                                                }
                                                onBlur={field.handleBlur}
                                                placeholder="username"
                                            />
                                            {field.state.meta.errors.length >
                                                0 && (
                                                <p className="text-sm text-destructive">
                                                    {field.state.meta.errors[0]}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </form.Field>
                            </div>

                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input value={user.email} disabled />
                            </div>

                            {submitError && (
                                <p className="text-center text-sm text-destructive">
                                    {submitError}
                                </p>
                            )}
                        </CredenzaBody>

                        <CredenzaFooter className="gap-2">
                            <CredenzaClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </CredenzaClose>
                            <Button
                                onClick={form.handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting && (
                                    <Loader2Icon className="size-4 animate-spin" />
                                )}
                                Save
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
                        Crop your photo
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
                            <Loader2Icon className="size-4 animate-spin" />
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
