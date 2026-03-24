import {
    BoldIcon,
    CodeIcon,
    HighlighterIcon,
    ItalicIcon,
    ListIcon,
    ListOrderedIcon,
    ListTodoIcon,
    MinusIcon,
    QuoteIcon,
    Redo2Icon,
    RemoveFormattingIcon,
    StrikethroughIcon,
    TableIcon,
    TypeIcon,
    UnderlineIcon,
    Undo2Icon,
} from "lucide-react";
import { useEditorStore } from "@/modules/blog/hooks/use-editor-store";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToolbarButton } from "../toolbar-button";
import { HeadingPicker } from "./heading-picker";
import { FontFamilyPicker } from "./font-family-picker";
import { FontSizePicker } from "./font-size-picker";
import { LineHeightPicker } from "./line-height-picker";
import { ColorPicker } from "./color-picker";
import { AlignmentPicker } from "./alignment-picker";
import { LinkButton } from "./link-button";
import { ImageUploadButton } from "./image-upload-button";

export function EditorToolbar() {
    const { editor } = useEditorStore();

    if (!editor) return null;

    const textColor = editor.getAttributes("textStyle").color || "#000000";
    const highlightColor = editor.getAttributes("highlight").color || "#f1c40f";

    return (
        <TooltipProvider>
            <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-background px-2 py-1.5">
                <ToolbarButton
                    icon={Undo2Icon}
                    label="Undo"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                />
                <ToolbarButton
                    icon={Redo2Icon}
                    label="Redo"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                />

                <Separator orientation="vertical" className="mx-1 h-5" />

                <HeadingPicker />
                <FontFamilyPicker />
                <FontSizePicker />
                <LineHeightPicker />

                <Separator orientation="vertical" className="mx-1 h-5" />

                <ToolbarButton
                    icon={BoldIcon}
                    label="Bold"
                    isActive={editor.isActive("bold")}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                />
                <ToolbarButton
                    icon={ItalicIcon}
                    label="Italic"
                    isActive={editor.isActive("italic")}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                />
                <ToolbarButton
                    icon={UnderlineIcon}
                    label="Underline"
                    isActive={editor.isActive("underline")}
                    onClick={() =>
                        editor.chain().focus().toggleUnderline().run()
                    }
                />
                <ToolbarButton
                    icon={StrikethroughIcon}
                    label="Strikethrough"
                    isActive={editor.isActive("strike")}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                />
                <ToolbarButton
                    icon={CodeIcon}
                    label="Inline code"
                    isActive={editor.isActive("code")}
                    onClick={() => editor.chain().focus().toggleCode().run()}
                />

                <Separator orientation="vertical" className="mx-1 h-5" />

                <ColorPicker
                    value={textColor}
                    onChange={(color) =>
                        editor.chain().focus().setColor(color).run()
                    }
                    icon={TypeIcon}
                    label="Text color"
                />
                <ColorPicker
                    value={highlightColor}
                    onChange={(color) =>
                        editor.chain().focus().setHighlight({ color }).run()
                    }
                    icon={HighlighterIcon}
                    label="Highlight"
                />

                <Separator orientation="vertical" className="mx-1 h-5" />

                <AlignmentPicker />
                <ToolbarButton
                    icon={ListIcon}
                    label="Bullet list"
                    isActive={editor.isActive("bulletList")}
                    onClick={() =>
                        editor.chain().focus().toggleBulletList().run()
                    }
                />
                <ToolbarButton
                    icon={ListOrderedIcon}
                    label="Ordered list"
                    isActive={editor.isActive("orderedList")}
                    onClick={() =>
                        editor.chain().focus().toggleOrderedList().run()
                    }
                />
                <ToolbarButton
                    icon={ListTodoIcon}
                    label="Task list"
                    isActive={editor.isActive("taskList")}
                    onClick={() =>
                        editor.chain().focus().toggleTaskList().run()
                    }
                />

                <Separator orientation="vertical" className="mx-1 h-5" />

                <LinkButton />
                <ImageUploadButton />
                <ToolbarButton
                    icon={TableIcon}
                    label="Insert table"
                    onClick={() =>
                        editor
                            .chain()
                            .focus()
                            .insertTable({
                                rows: 3,
                                cols: 3,
                                withHeaderRow: true,
                            })
                            .run()
                    }
                />
                <ToolbarButton
                    icon={QuoteIcon}
                    label="Blockquote"
                    isActive={editor.isActive("blockquote")}
                    onClick={() =>
                        editor.chain().focus().toggleBlockquote().run()
                    }
                />
                <ToolbarButton
                    icon={MinusIcon}
                    label="Horizontal rule"
                    onClick={() =>
                        editor.chain().focus().setHorizontalRule().run()
                    }
                />
                <ToolbarButton
                    icon={RemoveFormattingIcon}
                    label="Clear formatting"
                    onClick={() => editor.chain().focus().unsetAllMarks().run()}
                />
            </div>
        </TooltipProvider>
    );
}
