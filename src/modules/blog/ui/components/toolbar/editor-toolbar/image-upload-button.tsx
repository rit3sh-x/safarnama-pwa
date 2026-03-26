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

        const localUrl = URL.createObjectURL(file);
        editor?.chain().focus().setImage({ src: localUrl }).run();

        try {
            const { url } = await uploadFile(file);
            if (url && editor) {
                const { state } = editor;
                const { tr } = state;
                let swapped = false;
                state.doc.descendants((node, pos) => {
                    if (
                        !swapped &&
                        node.type.name === "image" &&
                        node.attrs.src === localUrl
                    ) {
                        const newNode = state.schema.nodes.image.create({
                            ...node.attrs,
                            src: url,
                        });
                        tr.replaceWith(pos, pos + node.nodeSize, newNode);
                        swapped = true;
                    }
                });
                if (swapped) editor.view.dispatch(tr);
            }
        } catch {
            if (editor) {
                const { state } = editor;
                const { tr } = state;
                state.doc.descendants((node, pos) => {
                    if (
                        node.type.name === "image" &&
                        node.attrs.src === localUrl
                    ) {
                        tr.delete(pos, pos + node.nodeSize);
                    }
                });
                editor.view.dispatch(tr);
            }
        } finally {
            URL.revokeObjectURL(localUrl);
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
