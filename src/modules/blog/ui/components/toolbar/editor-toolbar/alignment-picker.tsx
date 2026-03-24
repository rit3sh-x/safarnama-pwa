import {
    AlignCenterIcon,
    AlignJustifyIcon,
    AlignLeftIcon,
    AlignRightIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/modules/blog/hooks/use-editor-store";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

const alignments = [
    { value: "left", icon: AlignLeftIcon, label: "Left" },
    { value: "center", icon: AlignCenterIcon, label: "Center" },
    { value: "right", icon: AlignRightIcon, label: "Right" },
    { value: "justify", icon: AlignJustifyIcon, label: "Justify" },
];

export function AlignmentPicker() {
    const { editor } = useEditorStore();

    return (
        <Popover>
            <PopoverTrigger className="flex h-8 min-w-8 items-center justify-center rounded-md transition-colors hover:bg-muted">
                <AlignLeftIcon className="size-4" />
            </PopoverTrigger>
            <PopoverContent
                className="flex w-auto gap-0.5 p-1"
                align="start"
                sideOffset={8}
            >
                {alignments.map(({ value, icon: Icon, label }) => (
                    <Button
                        key={value}
                        aria-label={label}
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "size-8",
                            editor?.isActive({ textAlign: value }) && "bg-muted"
                        )}
                        onClick={() =>
                            editor?.chain().focus().setTextAlign(value).run()
                        }
                    >
                        <Icon className="size-4" />
                    </Button>
                ))}
            </PopoverContent>
        </Popover>
    );
}
