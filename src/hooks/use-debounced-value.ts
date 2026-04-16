import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delayMs = 300): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(timer);
    }, [value, delayMs]);

    return debounced;
}

export function useDebouncedInput<T>(
    externalValue: T,
    onCommit: (value: T) => void,
    delayMs = 400
): [T, (next: T) => void] {
    const [local, setLocal] = useState(externalValue);
    const [prevExternal, setPrevExternal] = useState(externalValue);

    if (!Object.is(prevExternal, externalValue)) {
        setPrevExternal(externalValue);
        setLocal(externalValue);
    }

    useEffect(() => {
        if (Object.is(local, externalValue)) return;
        const timer = setTimeout(() => {
            onCommit(local);
        }, delayMs);
        return () => clearTimeout(timer);
    }, [local, externalValue, delayMs, onCommit]);

    const setLocalWrapped = (next: T) => {
        setLocal(next);
    };

    return [local, setLocalWrapped];
}
