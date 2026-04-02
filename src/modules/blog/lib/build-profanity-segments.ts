type ProfanityPosition = { word: string; start: number; end: number };

export type ProfanitySegment = { text: string; profane: boolean };

export function buildProfanitySegments(
    text: string,
    positions: ProfanityPosition[]
): ProfanitySegment[] {
    if (!positions.length) return [{ text, profane: false }];

    const sorted = [...positions].sort((a, b) => a.start - b.start);
    const segments: ProfanitySegment[] = [];
    let cursor = 0;

    for (const pos of sorted) {
        if (pos.start > cursor) {
            segments.push({
                text: text.slice(cursor, pos.start),
                profane: false,
            });
        }
        segments.push({ text: text.slice(pos.start, pos.end), profane: true });
        cursor = pos.end;
    }

    if (cursor < text.length) {
        segments.push({ text: text.slice(cursor), profane: false });
    }

    return segments;
}
