import { useCallback, useRef, useState } from "react";
import { ImagePlusIcon, Loader2Icon, RefreshCwIcon, XIcon } from "lucide-react";
import { useUploadFileToConvex, cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface BlogCoverImageInputProps {
    value: string | undefined;
    onChange: (next: string | undefined) => void;
    readOnly?: boolean;
}

const ACCEPTED = "image/jpeg,image/png,image/webp,image/avif";

export function BlogCoverImageInput({
    value,
    onChange,
    readOnly = false,
}: BlogCoverImageInputProps) {
    const uploadFile = useUploadFileToConvex();
    const inputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFile = useCallback(
        async (file: File) => {
            setError(null);
            setIsUploading(true);
            try {
                const { url } = await uploadFile(file);
                if (!url) {
                    throw new Error("Upload succeeded but no URL returned");
                }
                onChange(url);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Upload failed");
            } finally {
                setIsUploading(false);
            }
        },
        [uploadFile, onChange]
    );

    const handleSelect = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void handleFile(file);
        },
        [handleFile]
    );

    const openPicker = useCallback(() => {
        if (readOnly || isUploading) return;
        inputRef.current?.click();
    }, [readOnly, isUploading]);

    const handleRemove = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            if (readOnly) return;
            onChange(undefined);
            setError(null);
        },
        [onChange, readOnly]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(false);
            if (readOnly || isUploading) return;
            const file = e.dataTransfer.files?.[0];
            if (file && file.type.startsWith("image/")) {
                void handleFile(file);
            }
        },
        [handleFile, readOnly, isUploading]
    );

    const handleDragOver = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            if (readOnly || isUploading) return;
            setIsDragging(true);
        },
        [readOnly, isUploading]
    );

    const handleDragLeave = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(false);
        },
        []
    );

    const hasImage = !!value;

    return (
        <div className="mx-auto w-full max-w-3xl px-4 pt-6 sm:px-6">
            <div
                role={readOnly ? undefined : "button"}
                tabIndex={readOnly ? undefined : 0}
                aria-label={
                    hasImage ? "Replace cover image" : "Add cover image"
                }
                onClick={openPicker}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openPicker();
                    }
                }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                    "group relative aspect-21/9 w-full overflow-hidden rounded-xl transition-all duration-200",
                    !hasImage &&
                        "border-2 border-dashed border-border bg-muted/30",
                    !hasImage &&
                        !readOnly &&
                        "cursor-pointer hover:border-solid hover:border-foreground/30 hover:bg-muted/50",
                    isDragging &&
                        "border-solid border-primary bg-primary/5 ring-2 ring-primary/20",
                    hasImage && "ring-1 ring-border",
                    hasImage && !readOnly && "cursor-pointer",
                    isUploading && "pointer-events-none"
                )}
            >
                {hasImage && (
                    <img
                        src={value}
                        alt="Blog cover"
                        className="absolute inset-0 size-full object-cover"
                        draggable={false}
                    />
                )}

                {!hasImage && !isUploading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
                        <div className="flex size-11 items-center justify-center rounded-full bg-background/80 text-muted-foreground transition-colors group-hover:bg-background group-hover:text-foreground">
                            <ImagePlusIcon className="size-5" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-sm font-medium text-foreground">
                                Add cover image
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Click or drop a file · up to 1 MB · JPG, PNG,
                                WebP
                            </p>
                        </div>
                    </div>
                )}

                {isUploading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 backdrop-blur-sm">
                        <Loader2Icon className="size-6 animate-spin text-foreground" />
                        <p className="text-xs font-medium text-muted-foreground">
                            Uploading…
                        </p>
                    </div>
                )}

                {hasImage && !isUploading && !readOnly && (
                    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-end bg-linear-to-b from-black/40 via-black/10 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                        <div className="pointer-events-auto flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openPicker();
                                }}
                                className="flex items-center gap-1.5 rounded-md bg-background/90 px-2.5 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background"
                            >
                                <RefreshCwIcon className="size-3.5" />
                                Replace
                            </button>
                            <button
                                type="button"
                                onClick={handleRemove}
                                aria-label="Remove cover image"
                                className="flex size-7 items-center justify-center rounded-md bg-background/90 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-destructive hover:text-destructive-foreground"
                            >
                                <XIcon className="size-3.5" />
                            </button>
                        </div>
                    </div>
                )}

                <Input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPTED}
                    className="hidden"
                    onChange={handleSelect}
                />
            </div>

            {error && (
                <p className="mt-2 text-xs text-destructive" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}
