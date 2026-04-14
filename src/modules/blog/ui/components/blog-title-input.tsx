import { useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";

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

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
    }, [value]);

    return (
        <div className="mx-auto w-full max-w-3xl px-4 pt-8 sm:px-6 md:pt-12">
            <Textarea
                ref={ref}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                readOnly={readOnly}
                placeholder="Untitled"
                rows={1}
                className="w-full resize-none overflow-hidden border-none bg-transparent font-serif text-3xl leading-tight font-bold text-foreground outline-none placeholder:text-muted-foreground/40 sm:text-4xl md:text-5xl"
            />
        </div>
    );
}
