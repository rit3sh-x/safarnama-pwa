import { useCallback, useEffect, useState } from "react";
import { MinusIcon, PlusIcon } from "lucide-react";
import { useEditorStore } from "@/modules/blog/hooks/use-editor-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DEFAULT_SIZE = 16;
const MIN_SIZE = 1;
const MAX_SIZE = 120;

export function FontSizePicker() {
    const { editor } = useEditorStore();
    const [inputValue, setInputValue] = useState(String(DEFAULT_SIZE));

    const getEditorFontSize = useCallback(() => {
        const raw = editor?.getAttributes("textStyle").fontSize as
            | string
            | undefined;
        if (!raw) return DEFAULT_SIZE;

        const parsed = Number.parseInt(raw.replace("px", ""), 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SIZE;
    }, [editor]);

    useEffect(() => {
        if (!editor) return;

        const sync = () => {
            setInputValue(String(getEditorFontSize()));
        };

        const frame = window.requestAnimationFrame(sync);
        editor.on("selectionUpdate", sync);
        editor.on("update", sync);

        return () => {
            window.cancelAnimationFrame(frame);
            editor.off("selectionUpdate", sync);
            editor.off("update", sync);
        };
    }, [editor, getEditorFontSize]);

    const updateSize = (delta: number) => {
        const size = getEditorFontSize() + delta;
        if (size >= MIN_SIZE && size <= MAX_SIZE) {
            editor?.chain().focus().setFontSize(`${size}px`).run();
            setInputValue(String(size));
        }
    };

    return (
        <div className="flex items-center gap-0.5">
            <Button
                aria-label="Decrease font size"
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => updateSize(-1)}
            >
                <MinusIcon className="size-3.5" />
            </Button>
            <Input
                aria-label="Font size"
                type="text"
                value={inputValue}
                onChange={(e) => {
                    const next = e.target.value;
                    setInputValue(next);

                    const size = Number.parseInt(next, 10);
                    if (
                        Number.isFinite(size) &&
                        size >= MIN_SIZE &&
                        size <= MAX_SIZE
                    ) {
                        editor?.chain().focus().setFontSize(`${size}px`).run();
                    }
                }}
                onBlur={() => {
                    const parsed = Number.parseInt(inputValue, 10);
                    const safe =
                        Number.isFinite(parsed) &&
                        parsed >= MIN_SIZE &&
                        parsed <= MAX_SIZE
                            ? parsed
                            : getEditorFontSize();
                    setInputValue(String(safe));
                    editor?.chain().focus().setFontSize(`${safe}px`).run();
                }}
                className="h-7 w-14 rounded-md px-1 text-center text-sm tabular-nums"
            />
            <Button
                aria-label="Increase font size"
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => updateSize(1)}
            >
                <PlusIcon className="size-3.5" />
            </Button>
        </div>
    );
}
