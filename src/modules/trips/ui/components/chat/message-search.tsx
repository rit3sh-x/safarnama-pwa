import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    ChevronDownIcon,
    ChevronUpIcon,
    SearchIcon,
    XIcon,
} from "lucide-react";
import type { ChatMessage } from "./types";

interface MessageSearchProps {
    messages: ChatMessage[];
    onClose: () => void;
    onNavigateToMessage: (messageId: string) => void;
}

export function MessageSearch({
    messages,
    onClose,
    onNavigateToMessage,
}: MessageSearchProps) {
    const [query, setQuery] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const matches = useMemo(() => {
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        return messages.filter(
            (m) =>
                !m.isSystem &&
                !m.isDeleted &&
                m.content.toLowerCase().includes(q)
        );
    }, [messages, query]);

    const activeIndex =
        matches.length === 0 ? 0 : Math.min(currentIndex, matches.length - 1);

    useEffect(() => {
        if (matches.length > 0 && matches[activeIndex]) {
            onNavigateToMessage(matches[activeIndex]._id);
        }
    }, [activeIndex, matches, onNavigateToMessage]);

    const goUp = useCallback(() => {
        if (matches.length === 0) return;
        setCurrentIndex((i) => (i > 0 ? i - 1 : matches.length - 1));
    }, [matches.length]);

    const goDown = useCallback(() => {
        if (matches.length === 0) return;
        setCurrentIndex((i) => (i < matches.length - 1 ? i + 1 : 0));
    }, [matches.length]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter") {
                e.preventDefault();
                if (e.shiftKey) goUp();
                else goDown();
            }
            if (e.key === "Escape") {
                onClose();
            }
        },
        [goUp, goDown, onClose]
    );

    const handleQueryChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setQuery(e.target.value);
            setCurrentIndex(0);
        },
        []
    );

    return (
        <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-2">
            <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
            <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleQueryChange}
                onKeyDown={handleKeyDown}
                placeholder="Search messages..."
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            {query && (
                <span className="shrink-0 text-xs text-muted-foreground">
                    {matches.length > 0
                        ? `${activeIndex + 1} of ${matches.length}`
                        : "No results"}
                </span>
            )}
            <div className="flex shrink-0 items-center gap-0.5">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={goUp}
                    disabled={matches.length === 0}
                >
                    <ChevronUpIcon className="size-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={goDown}
                    disabled={matches.length === 0}
                >
                    <ChevronDownIcon className="size-4" />
                </Button>
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onClose}
            >
                <XIcon className="size-4" />
            </Button>
        </div>
    );
}

interface HighlightSearchTextProps {
    text: string;
    query: string;
}

export function HighlightSearchText({ text, query }: HighlightSearchTextProps) {
    if (!query.trim()) return text;

    const q = query.toLowerCase();
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text;

    return (
        <>
            {text.slice(0, idx)}
            <mark className="rounded-sm bg-yellow-300/60 px-0.5 dark:bg-yellow-500/40">
                {text.slice(idx, idx + query.length)}
            </mark>
            {text.slice(idx + query.length)}
        </>
    );
}
