import { z } from "zod";
import { useForm } from "@tanstack/react-form";
import { useCallback, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { CameraIcon, Loader2Icon } from "lucide-react";
import { cn, useUploadFileToConvex, stringToHex } from "@/lib/utils";
import { MAX_FILE_SIZE } from "@/lib/constants";
import { updateProfile } from "../../hooks/use-settings-handlers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Credenza,
    CredenzaBody,
    CredenzaClose,
    CredenzaContent,
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

function getCroppedImage(imageSrc: string, crop: Area): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = crop.width;
            canvas.height = crop.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) return reject(new Error("Canvas context unavailable"));

            ctx.drawImage(
                image,
                crop.x,
                crop.y,
                crop.width,
                crop.height,
                0,
                0,
                crop.width,
                crop.height
            );

            canvas.toBlob(
                (blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error("Failed to create blob"));
                },
                "image/jpeg",
                0.85
            );
        };
        image.onerror = reject;
        image.crossOrigin = "anonymous";
        image.src = imageSrc;
    });
}

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

    const [cropDialogOpen, setCropDialogOpen] = useState(false);
    const [rawImage, setRawImage] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedArea, setCroppedArea] = useState<Area | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadFile = useUploadFileToConvex();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

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

    const resetState = () => {
        setCroppedPreview(null);
        setCroppedBlob(null);
        setImageError(null);
        setSubmitError(null);
        setRawImage(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedArea(null);
    };

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setImageError("Please select an image file");
            return;
        }

        setImageError(null);
        const url = URL.createObjectURL(file);
        setRawImage(url);
        setCropDialogOpen(true);
        e.target.value = "";
    };

    const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
        setCroppedArea(croppedPixels);
    }, []);

    const handleCropConfirm = async () => {
        if (!rawImage || !croppedArea) return;

        try {
            const blob = await getCroppedImage(rawImage, croppedArea);
            setCroppedBlob(blob);
            setCroppedPreview(URL.createObjectURL(blob));
        } catch {
            setImageError("Failed to crop image");
        } finally {
            setCropDialogOpen(false);
            if (rawImage) URL.revokeObjectURL(rawImage);
            setRawImage(null);
        }
    };

    const avatarBgColor = stringToHex(user.username);
    const displayImage = croppedPreview ?? user.image;

    return (
        <>
            <Credenza
                open={open}
                onOpenChange={(next) => {
                    if (!next) resetState();
                    onOpenChange(next);
                }}
            >
                <CredenzaContent className="max-h-[90vh] sm:max-w-md">
                    <CredenzaHeader>
                        <CredenzaTitle>Edit Profile</CredenzaTitle>
                    </CredenzaHeader>

                    <CredenzaBody className="space-y-6 overflow-y-auto">
                        <div className="flex flex-col items-center gap-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
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
                                        {field.state.meta.errors.length > 0 && (
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
                </CredenzaContent>
            </Credenza>

            {cropDialogOpen && (
                <Credenza
                    open={cropDialogOpen}
                    onOpenChange={setCropDialogOpen}
                >
                    <CredenzaContent className="sm:max-w-md">
                        <CredenzaHeader>
                            <CredenzaTitle>Crop your photo</CredenzaTitle>
                        </CredenzaHeader>

                        <CredenzaBody>
                            <div className="relative h-64 w-full">
                                {rawImage && (
                                    <Cropper
                                        image={rawImage}
                                        crop={crop}
                                        zoom={zoom}
                                        aspect={1}
                                        cropShape="round"
                                        onCropChange={setCrop}
                                        onZoomChange={setZoom}
                                        onCropComplete={onCropComplete}
                                    />
                                )}
                            </div>
                        </CredenzaBody>

                        <CredenzaFooter className="gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setCropDialogOpen(false);
                                    if (rawImage) URL.revokeObjectURL(rawImage);
                                    setRawImage(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleCropConfirm}>Confirm</Button>
                        </CredenzaFooter>
                    </CredenzaContent>
                </Credenza>
            )}
        </>
    );
}
