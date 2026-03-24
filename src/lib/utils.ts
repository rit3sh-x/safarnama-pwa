import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Id } from "@backend/dataModel";
import { api } from "@backend/api";
import { useMutation } from "convex/react";
import { MAX_FILE_SIZE } from "./constants";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function useUploadFileToConvex(): (
    file: File
) => Promise<{ storageId: Id<"_storage">; url: string | null }> {
    const generateUploadUrl = useMutation(api.methods.file.generateUploadUrl);
    const confirmUpload = useMutation(api.methods.file.confirmUpload);

    return async (file: File) => {
        if (file.size > MAX_FILE_SIZE) {
            throw new Error("File exceeds 1 MB limit");
        }

        const postUrl = await generateUploadUrl();

        const result = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
        });

        if (!result.ok) {
            throw new Error(`Upload failed: ${result.statusText}`);
        }

        const body = await result.json().catch(() => {
            throw new Error("Upload failed: invalid server response");
        });
        const { storageId }: { storageId: Id<"_storage"> } = body;

        return await confirmUpload({ storageId });
    };
}

export function stringToHex(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `#${((hash >>> 0) & 0xffffff).toString(16).padStart(6, "0")}`;
}

export function getInitials(name: string) {
    return name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");
}
