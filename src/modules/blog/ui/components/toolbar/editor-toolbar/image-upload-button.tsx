import { ImageIcon } from "lucide-react";
import { useEditorStore } from "@/modules/blog/hooks/use-editor-store";
import { useUploadFileToConvex } from "@/lib/utils";
import { ToolbarButton } from "../toolbar-button";

export function ImageUploadButton() {
    const { editor } = useEditorStore();
    const uploadFile = useUploadFileToConvex();

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const { url } = await uploadFile(file);
            if (url) {
                editor?.chain().focus().setImage({ src: url }).run();
            }
        } catch {
            // upload failed
        }
        e.target.value = "";
    };

    return (
        <>
            <ToolbarButton
                icon={ImageIcon}
                label="Image"
                onClick={() =>
                    document.getElementById("blog-image-upload")?.click()
                }
            />
            <input
                id="blog-image-upload"
                aria-label="Upload image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
            />
        </>
    );
}
