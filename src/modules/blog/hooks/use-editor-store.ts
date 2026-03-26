import { atom, useAtom } from "jotai";
import type { Editor } from "@tiptap/react";

const editorAtom = atom<Editor | null>(null);

export function useEditorStore() {
    const [editor, setEditor] = useAtom(editorAtom);

    return {
        editor,
        setEditor,
        unsetEditor: () => setEditor(null),
    };
}
