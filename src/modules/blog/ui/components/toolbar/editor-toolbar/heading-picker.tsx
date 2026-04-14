import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/modules/blog/hooks/use-editor-store";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

type HeadingLevel = 0 | 1 | 2 | 3;

const HEADINGS: Array<{
    label: string;
    value: HeadingLevel;
    previewClass: string;
}> = [
    { label: "Normal text", value: 0, previewClass: "text-sm" },
    { label: "Heading 1", value: 1, previewClass: "text-lg font-bold" },
    { label: "Heading 2", value: 2, previewClass: "text-base font-semibold" },
    { label: "Heading 3", value: 3, previewClass: "text-sm font-semibold" },
];

export function HeadingPicker() {
    const { editor } = useEditorStore();

    const applyHeading = (value: HeadingLevel) => {
        if (!editor) return;

        if (value === 0) {
            editor.chain().focus().setParagraph().run();
            return;
        }

        editor.chain().focus().toggleHeading({ level: value }).run();
    };

    const activeLevel: HeadingLevel = (() => {
        for (const level of [1, 2, 3] as const) {
            if (editor?.isActive("heading", { level })) return level;
        }
        return 0;
    })();

    const currentLabel =
        HEADINGS.find((h) => h.value === activeLevel)?.label ?? "Normal text";

    return (
        <Popover>
            <PopoverTrigger className="flex h-8 w-32 shrink-0 items-center justify-between rounded-md px-2 text-sm transition-colors hover:bg-muted">
                <span className="truncate">{currentLabel}</span>
                <ChevronDownIcon className="ml-1 size-3.5 shrink-0 opacity-50" />
            </PopoverTrigger>
            <PopoverContent
                className="w-48 gap-1 p-1"
                align="start"
                sideOffset={8}
            >
                {HEADINGS.map(({ label, value, previewClass }) => {
                    const isActive = value === activeLevel;
                    return (
                        <Button
                            key={value}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => applyHeading(value)}
                            aria-pressed={isActive}
                            className={cn(
                                "flex w-full items-center rounded-md bg-background px-2 py-1.5 text-foreground transition-colors hover:bg-muted/30",
                                previewClass,
                                isActive && "bg-muted/30 font-medium"
                            )}
                        >
                            {label}
                        </Button>
                    );
                })}
            </PopoverContent>
        </Popover>
    );
}
