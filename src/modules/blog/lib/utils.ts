const SCHEME_RE = /^[a-z][a-z\d+\-.]*:/i;

export function normalizeHref(rawHref: string): string | null {
    const href = rawHref.trim();
    if (!href) return null;

    if (SCHEME_RE.test(href)) return href;
    if (href.startsWith("//")) return `https:${href}`;
    if (href.startsWith("/") || href.startsWith("#")) return href;

    return `https://${href}`;
}
