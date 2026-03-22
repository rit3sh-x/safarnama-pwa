import { useCallback, useRef, useState } from "react"
import {
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ImageIcon,
  ListIcon,
  ListOrderedIcon,
  ListTodoIcon,
  MinusIcon,
  PlusIcon,
  QuoteIcon,
  TableIcon,
} from "lucide-react"
import { useEditorStore } from "../../../hooks/use-editor-store"
import { useUploadFileToConvex } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

interface InsertOption {
  icon: typeof PlusIcon
  label: string
  id: string
}

const OPTIONS: InsertOption[] = [
  { icon: Heading1Icon, label: "Heading 1", id: "h1" },
  { icon: Heading2Icon, label: "Heading 2", id: "h2" },
  { icon: Heading3Icon, label: "Heading 3", id: "h3" },
  { icon: ListIcon, label: "Bullet List", id: "bullet" },
  { icon: ListOrderedIcon, label: "Ordered List", id: "ordered" },
  { icon: ListTodoIcon, label: "Task List", id: "task" },
  { icon: QuoteIcon, label: "Blockquote", id: "quote" },
  { icon: CodeIcon, label: "Code Block", id: "code" },
  { icon: ImageIcon, label: "Image", id: "image" },
  { icon: TableIcon, label: "Table", id: "table" },
  { icon: MinusIcon, label: "Divider", id: "hr" },
]

export function MobileInsertButton() {
  const { editor } = useEditorStore()
  const [open, setOpen] = useState(false)
  const uploadFile = useUploadFileToConvex()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { url } = await uploadFile(file)
      if (url && editor) editor.chain().focus().setImage({ src: url }).run()
    } catch {
      // silently fail
    }
    e.target.value = ""
  }

  const handleAction = useCallback(
    (id: string) => {
      if (!editor) return
      setOpen(false)

      requestAnimationFrame(() => {
        switch (id) {
          case "h1":
            editor.chain().focus().toggleHeading({ level: 1 }).run()
            break
          case "h2":
            editor.chain().focus().toggleHeading({ level: 2 }).run()
            break
          case "h3":
            editor.chain().focus().toggleHeading({ level: 3 }).run()
            break
          case "bullet":
            editor.chain().focus().toggleBulletList().run()
            break
          case "ordered":
            editor.chain().focus().toggleOrderedList().run()
            break
          case "task":
            editor.chain().focus().toggleTaskList().run()
            break
          case "quote":
            editor.chain().focus().toggleBlockquote().run()
            break
          case "code":
            editor.chain().focus().toggleCodeBlock().run()
            break
          case "image":
            fileInputRef.current?.click()
            break
          case "table":
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
            break
          case "hr":
            editor.chain().focus().setHorizontalRule().run()
            break
        }
      })
    },
    [editor]
  )

  if (!editor) return null

  return (
    <>
      <Button
        aria-label="Insert element"
        size="icon"
        className="fixed right-4 bottom-20 z-40 size-12 rounded-full shadow-lg"
        onClick={() => setOpen(true)}
      >
        <PlusIcon className="size-5" />
      </Button>

      <input
        ref={fileInputRef}
        aria-label="Upload image"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Insert element</DrawerTitle>
          </DrawerHeader>
          <div className="grid grid-cols-3 gap-2 px-4 pb-6">
            {OPTIONS.map(({ icon: Icon, label, id }) => (
              <button
                key={id}
                onClick={() => handleAction(id)}
                className="flex min-h-12 flex-col items-center gap-1.5 rounded-xl p-3 text-muted-foreground transition-colors hover:bg-muted/50 active:bg-muted"
              >
                <Icon className="size-5" />
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
