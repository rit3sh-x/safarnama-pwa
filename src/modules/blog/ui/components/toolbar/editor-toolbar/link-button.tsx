import { useState } from "react";
import { Link2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/modules/blog/hooks/use-editor-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export function LinkButton() {
    const { editor } = useEditorStore();
    const [href, setHref] = useState("");

    const applyLink = () => {
        editor?.chain().focus().extendMarkRange("link").setLink({ href }).run();
    };

    return (
        <Popover
            onOpenChange={(open) => {
                if (open) setHref(editor?.getAttributes("link").href || "");
            }}
        >
            <PopoverTrigger
                className={cn(
                    "flex h-8 min-w-8 items-center justify-center rounded-md transition-colors hover:bg-muted",
                    editor?.isActive("link") && "bg-muted"
                )}
            >
                <Link2Icon className="size-4" />
            </PopoverTrigger>
            <PopoverContent
                className="flex w-72 items-center gap-2 p-2"
                align="start"
                sideOffset={8}
            >
                <Input
                    placeholder="https://example.com"
                    value={href}
                    onChange={(e) => setHref(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            applyLink();
                        }
                    }}
                    className="h-8 text-sm"
                />
                <Button size="sm" className="h-8 shrink-0" onClick={applyLink}>
                    Apply
                </Button>
            </PopoverContent>
        </Popover>
    );
}
