import { Extension } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

const profanityPluginKey = new PluginKey("profanityHighlight");

function buildTextMap(doc: ProseMirrorNode): {
    text: string;
    offsets: number[];
} {
    const parts: string[] = [];
    const offsets: number[] = [];

    doc.descendants((node, pos) => {
        if (node.isText && node.text) {
            for (let i = 0; i < node.text.length; i++) {
                offsets.push(pos + i);
            }
            parts.push(node.text);
        } else if (node.isBlock && parts.length > 0) {
            offsets.push(-1);
            parts.push(" ");
        }
        return true;
    });

    return { text: parts.join(""), offsets };
}

export const ProfanityHighlightExtension = Extension.create({
    name: "profanityHighlight",

    addProseMirrorPlugins() {
        let debounceTimer: ReturnType<typeof setTimeout> | null = null;
        let currentSeq = 0;

        return [
            new Plugin({
                key: profanityPluginKey,
                state: {
                    init() {
                        return DecorationSet.empty;
                    },
                    apply(tr, decorationSet) {
                        const meta = tr.getMeta(profanityPluginKey);
                        if (meta) return meta;
                        return tr.docChanged
                            ? decorationSet.map(tr.mapping, tr.doc)
                            : decorationSet;
                    },
                },
                view() {
                    return {
                        update(view, prevState) {
                            if (view.state.doc.eq(prevState.doc)) return;

                            if (debounceTimer) clearTimeout(debounceTimer);
                            const seq = ++currentSeq;

                            debounceTimer = setTimeout(async () => {
                                const { checkProfanity } =
                                    await import("../../../lib/profanity");
                                const { text, offsets } = buildTextMap(
                                    view.state.doc
                                );
                                const result = await checkProfanity(text);

                                if (seq !== currentSeq) return;

                                const decorations: Decoration[] = [];
                                for (const pos of result.positions) {
                                    const from = offsets[pos.start];
                                    const end = offsets[pos.end - 1];
                                    if (
                                        from == null ||
                                        end == null ||
                                        from === -1 ||
                                        end === -1
                                    )
                                        continue;
                                    decorations.push(
                                        Decoration.inline(from, end + 1, {
                                            class: "profanity-squiggle",
                                        })
                                    );
                                }

                                const decoSet = DecorationSet.create(
                                    view.state.doc,
                                    decorations
                                );

                                view.dispatch(
                                    view.state.tr.setMeta(
                                        profanityPluginKey,
                                        decoSet
                                    )
                                );
                            }, 300);
                        },
                        destroy() {
                            if (debounceTimer) clearTimeout(debounceTimer);
                        },
                    };
                },
                props: {
                    decorations(state) {
                        return profanityPluginKey.getState(state);
                    },
                },
            }),
        ];
    },
});
