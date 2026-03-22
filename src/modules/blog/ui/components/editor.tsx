import { useEditor, EditorContent } from "@tiptap/react"
import { TaskItem } from "@tiptap/extension-task-item"
import { TaskList } from "@tiptap/extension-task-list"
import { Table } from "@tiptap/extension-table"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import { TableRow } from "@tiptap/extension-table-row"
import { Image } from "@tiptap/extension-image"
import { FontFamily } from "@tiptap/extension-font-family"
import { Highlight } from "@tiptap/extension-highlight"
import { Color } from "@tiptap/extension-color"
import { TextStyle } from "@tiptap/extension-text-style"
import { StarterKit } from "@tiptap/starter-kit"
import { TextAlign } from "@tiptap/extension-text-align"
import { Placeholder } from "@tiptap/extension-placeholder"
import { useEditorStore } from "../../hooks/use-editor-store"
import { FontSizeExtension } from "./extensions/font-size"
import { LineHeightExtension } from "./extensions/line-height"

interface EditorProps {
  initialContent?: string
  editable?: boolean
}

export const Editor = ({ initialContent, editable = true }: EditorProps) => {
  const { setEditor } = useEditorStore()

  const editor = useEditor({
    content: initialContent,
    editable,
    autofocus: editable,
    immediatelyRender: false,
    onCreate: ({ editor }) => setEditor(editor),
    onDestroy: () => setEditor(null),
    onUpdate: ({ editor }) => setEditor(editor),
    onSelectionUpdate: ({ editor }) => setEditor(editor),
    onTransaction: ({ editor }) => setEditor(editor),
    onFocus: ({ editor }) => setEditor(editor),
    onBlur: ({ editor }) => setEditor(editor),
    onContentError: ({ editor }) => setEditor(editor),
    editorProps: {
      attributes: {
        class: "tiptap focus:outline-none min-h-[50vh] font-serif text-base leading-relaxed",
      },
    },
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          defaultProtocol: "https://",
          autolink: true,
        },
      }),
      FontSizeExtension,
      LineHeightExtension,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      Color,
      FontFamily,
      TextStyle,
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableCell,
      TableHeader,
      TableRow,
      Image.configure({
        resize: {
          enabled: true,
          minHeight: 40,
          minWidth: 40,
          directions: [
            "top",
            "right",
            "bottom",
            "left",
            "top-right",
            "top-left",
            "bottom-right",
            "bottom-left",
          ],
          alwaysPreserveAspectRatio: true,
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing your story...",
      }),
    ],
  })

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 md:py-10">
      <EditorContent editor={editor} />
    </div>
  )
}
