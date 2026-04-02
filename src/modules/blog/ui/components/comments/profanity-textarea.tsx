import {
    forwardRef,
    useRef,
    useCallback,
    useImperativeHandle,
    type TextareaHTMLAttributes,
} from "react";
import { useProfanityCheck } from "../../../hooks/use-profanity-check";
import { buildProfanitySegments } from "../../../lib/build-profanity-segments";
import { cn } from "@/lib/utils";

interface ProfanityTextareaProps extends Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    "children"
> {
    value: string;
}

export const ProfanityTextarea = forwardRef<
    HTMLTextAreaElement,
    ProfanityTextareaProps
>(({ value, className, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const mirrorRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => internalRef.current!);

    const { result } = useProfanityCheck(value);

    const syncScroll = useCallback(() => {
        if (internalRef.current && mirrorRef.current) {
            mirrorRef.current.scrollTop = internalRef.current.scrollTop;
        }
    }, []);

    const segments = buildProfanitySegments(value, result?.positions ?? []);

    return (
        <div className="relative">
            <div
                ref={mirrorRef}
                aria-hidden="true"
                className={cn(
                    `pointer-events-none absolute inset-0 overflow-hidden wrap-break-word whitespace-pre-wrap text-transparent`,
                    className
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
                ref={internalRef}
                value={value}
                onScroll={syncScroll}
                className={cn("relative bg-transparent", className)}
                {...props}
            />
        </div>
    );
});

ProfanityTextarea.displayName = "ProfanityTextarea";
