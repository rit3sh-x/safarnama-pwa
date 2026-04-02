import { useState, useEffect, useRef } from "react";
import type { ProfanityResult } from "../lib/profanity";

export function useProfanityCheck(text: string, debounceMs = 300) {
    const [result, setResult] = useState<ProfanityResult | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const seqRef = useRef(0);

    useEffect(() => {
        if (!text.trim()) {
            setResult(null);
            return;
        }

        const seq = ++seqRef.current;
        setIsChecking(true);

        const timer = setTimeout(async () => {
            const { checkProfanity } = await import("../lib/profanity");
            const res = await checkProfanity(text);
            if (seq === seqRef.current) {
                setResult(res);
                setIsChecking(false);
            }
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [text, debounceMs]);

    return { result, isChecking };
}
