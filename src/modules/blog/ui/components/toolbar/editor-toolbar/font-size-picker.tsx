import { MinusIcon, PlusIcon } from "lucide-react"
import { useEditorStore } from "@/modules/blog/hooks/use-editor-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function FontSizePicker() {
  const { editor } = useEditorStore()

  const currentSize = editor?.getAttributes("textStyle").fontSize
    ? editor.getAttributes("textStyle").fontSize.replace("px", "")
    : "16"

  const updateSize = (delta: number) => {
    const size = parseInt(currentSize) + delta
    if (size > 0 && size <= 120) {
      editor?.chain().focus().setFontSize(`${size}px`).run()
    }
  }

  return (
    <div className="flex items-center gap-0.5">
      <Button
        aria-label="Decrease font size"
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => updateSize(-1)}
      >
        <MinusIcon className="size-3.5" />
      </Button>
      <Input
        aria-label="Font size"
        type="text"
        value={currentSize}
        onChange={(e) => {
          const size = parseInt(e.target.value)
          if (!isNaN(size) && size > 0 && size <= 120) {
            editor?.chain().focus().setFontSize(`${size}px`).run()
          }
        }}
        className="h-7 w-10 rounded-md text-center text-sm"
      />
      <Button
        aria-label="Increase font size"
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => updateSize(1)}
      >
        <PlusIcon className="size-3.5" />
      </Button>
    </div>
  )
}
