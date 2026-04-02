import { useRef, useEffect } from "react";
import { useProfanityCheck } from "../../hooks/use-profanity-check";
import { buildProfanitySegments } from "../../lib/build-profanity-segments";
import { cn } from "@/lib/utils";

interface BlogTitleInputProps {
    value: string;
    onChange: (value: string) => void;
    readOnly?: boolean;
}

export function BlogTitleInput({
    value,
    onChange,
    readOnly = false,
}: BlogTitleInputProps) {
    const ref = useRef<HTMLTextAreaElement>(null);
    const { result } = useProfanityCheck(value);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
    }, [value]);

    const segments = buildProfanitySegments(value, result?.positions ?? []);
    const textClass =
        "w-full resize-none overflow-hidden border-none bg-transparent font-serif text-3xl leading-tight font-bold text-foreground outline-none placeholder:text-muted-foreground/40 sm:text-4xl md:text-5xl";

    return (
        <div className="mx-auto w-full max-w-3xl px-4 pt-8 sm:px-6 md:pt-12">
            <div className="relative">
                <div
                    aria-hidden="true"
                    className={cn(
                        `pointer-events-none absolute inset-0 overflow-hidden wrap-break-word whitespace-pre-wrap text-transparent`,
                        textClass
                    )}
                >
                    {segments.map((seg, i) =>
                        seg.profane ? (
                            <span
                                key={i}
                                className="profanity-squiggle bg-transparent text-transparent"
                            >
                                {seg.text}
                            </span>
                        ) : (
                            <span key={i}>{seg.text}</span>
                        )
                    )}
                </div>
                <textarea
                    ref={ref}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    readOnly={readOnly}
                    placeholder="Untitled"
                    rows={1}
                    className={cn("relative bg-transparent", textClass)}
                />
            </div>
        </div>
    );
}
