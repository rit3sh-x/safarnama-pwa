import { BubbleMenu } from "@tiptap/react/menus";
import {
    BoldIcon,
    CodeIcon,
    HighlighterIcon,
    ItalicIcon,
    Link2Icon,
    StrikethroughIcon,
    UnderlineIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "../../../hooks/use-editor-store";
import { normalizeHref } from "@/modules/blog/lib/utils";

interface FormatButtonProps {
    icon: typeof BoldIcon;
    isActive?: boolean;
    onClick: () => void;
    label: string;
}

function FormatButton({
    icon: Icon,
    isActive,
    onClick,
    label,
}: FormatButtonProps) {
    return (
        <button
            aria-label={label}
            onPointerDown={(e) => {
                e.preventDefault();
                onClick();
            }}
            className={cn(
                "flex size-10 items-center justify-center rounded-md transition-colors active:bg-white/20",
                isActive ? "bg-white/20 text-white" : "text-white/80"
            )}
        >
            <Icon className="size-4" />
        </button>
    );
}

export function FloatingFormatToolbar() {
    const { editor } = useEditorStore();

    if (!editor) return null;

    return (
        <BubbleMenu
            editor={editor}
            className="flex items-center gap-0.5 rounded-xl bg-foreground px-1 py-0.5 shadow-lg"
        >
            <FormatButton
                label="Bold"
                icon={BoldIcon}
                isActive={editor.isActive("bold")}
                onClick={() => editor.chain().focus().toggleBold().run()}
            />
            <FormatButton
                label="Italic"
                icon={ItalicIcon}
                isActive={editor.isActive("italic")}
                onClick={() => editor.chain().focus().toggleItalic().run()}
            />
            <FormatButton
                label="Underline"
                icon={UnderlineIcon}
                isActive={editor.isActive("underline")}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
            />
            <FormatButton
                label="Strikethrough"
                icon={StrikethroughIcon}
                isActive={editor.isActive("strike")}
                onClick={() => editor.chain().focus().toggleStrike().run()}
            />
            <FormatButton
                label="Code"
                icon={CodeIcon}
                isActive={editor.isActive("code")}
                onClick={() => editor.chain().focus().toggleCode().run()}
            />
            <FormatButton
                label="Highlight"
                icon={HighlighterIcon}
                isActive={editor.isActive("highlight")}
                onClick={() =>
                    editor
                        .chain()
                        .focus()
                        .toggleHighlight({ color: "#f1c40f" })
                        .run()
                }
            />
            <FormatButton
                label="Link"
                icon={Link2Icon}
                isActive={editor.isActive("link")}
                onClick={() => {
                    const rawHref = window.prompt("Enter URL");
                    const href = rawHref ? normalizeHref(rawHref) : null;
                    if (href) {
                        editor
                            .chain()
                            .focus()
                            .extendMarkRange("link")
                            .setLink({ href })
                            .run();
                    }
                }}
            />
        </BubbleMenu>
    );
}
