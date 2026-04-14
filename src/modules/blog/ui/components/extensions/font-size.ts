import { Extension } from "@tiptap/react";
import "@tiptap/extension-text-style";

function normalizeFontSize(fontSize: string): string | null {
    const raw = fontSize.trim().toLowerCase();
    if (!raw) return null;

    if (raw.endsWith("px")) {
        const n = Number.parseInt(raw.replace("px", ""), 10);
        if (!Number.isFinite(n) || n <= 0) return null;
        return `${n}px`;
    }

    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n) || n <= 0) return null;
    return `${n}px`;
}

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        fontSize: {
            setFontSize: (fontSize: string) => ReturnType;
            unsetFontSize: () => ReturnType;
        };
    }
}

export const FontSizeExtension = Extension.create({
    name: "fontSize",
    addOptions() {
        return {
            types: ["textStyle"],
        };
    },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: null,
                        renderHTML: (attributes) => {
                            if (!attributes.fontSize) return {};
                            return {
                                style: `font-size: ${attributes.fontSize}`,
                            };
                        },
                        parseHTML: (element) => {
                            const normalized = normalizeFontSize(
                                element.style.fontSize ?? ""
                            );
                            return {
                                fontSize: normalized,
                            };
                        },
                    },
                },
            },
        ];
    },
    addCommands() {
        return {
            setFontSize:
                (fontSize) =>
                ({ chain }) => {
                    const normalized = normalizeFontSize(fontSize);
                    if (!normalized) {
                        return chain()
                            .setMark("textStyle", { fontSize: null })
                            .removeEmptyTextStyle()
                            .run();
                    }
                    return chain()
                        .setMark("textStyle", { fontSize: normalized })
                        .run();
                },
            unsetFontSize:
                () =>
                ({ chain }) => {
                    return chain()
                        .setMark("textStyle", { fontSize: null })
                        .removeEmptyTextStyle()
                        .run();
                },
        };
    },
});
