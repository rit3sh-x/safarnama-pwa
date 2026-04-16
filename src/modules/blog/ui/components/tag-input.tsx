import { useRef, useState, type KeyboardEvent } from "react";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagInputProps {
    value: string[];
    onChange: (next: string[]) => void;
    suggestions?: string[];
    placeholder?: string;
    className?: string;
}

function normalize(raw: string): string {
    return raw.trim().toLowerCase();
}

export function TagInput({
    value,
    onChange,
    suggestions = [],
    placeholder = "Add a tag…",
    className,
}: TagInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [draft, setDraft] = useState("");

    const addTag = (raw: string) => {
        const clean = normalize(raw);
        if (!clean || value.includes(clean)) return;
        onChange([...value, clean]);
    };

    const removeTag = (tag: string) => {
        onChange(value.filter((t) => t !== tag));
    };

    const commitDraft = () => {
        if (!draft) return;
        addTag(draft);
        setDraft("");
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commitDraft();
        } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
            e.preventDefault();
            removeTag(value[value.length - 1]);
        }
    };

    const availableSuggestions = suggestions.filter((s) => !value.includes(s));

    return (
        <div className={cn("space-y-3", className)}>
            <div
                onClick={() => inputRef.current?.focus()}
                className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 text-sm transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30"
            >
                {value.map((tag) => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-foreground py-0.5 pr-1 pl-2.5 text-xs font-medium text-background"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeTag(tag);
                            }}
                            aria-label={`Remove ${tag}`}
                            className="flex size-4 items-center justify-center rounded-full hover:bg-background/15"
                        >
                            <XIcon className="size-2.5" />
                        </button>
                    </span>
                ))}
                <input
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={commitDraft}
                    placeholder={value.length === 0 ? placeholder : ""}
                    className="min-w-[10ch] flex-1 bg-transparent px-1 py-0.5 outline-none placeholder:text-muted-foreground"
                />
            </div>

            {availableSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {availableSuggestions.map((tag) => (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => addTag(tag)}
                            className="rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-solid hover:border-foreground/40 hover:text-foreground"
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
