import { ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEditorStore } from "@/modules/blog/hooks/use-editor-store"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const headings = [
  { label: "Normal text", value: 0 },
  { label: "Heading 1", value: 1 },
  { label: "Heading 2", value: 2 },
  { label: "Heading 3", value: 3 },
]

export function HeadingPicker() {
  const { editor } = useEditorStore()

  const current = (() => {
    for (let level = 1; level <= 3; level++) {
      if (editor?.isActive("heading", { level })) return `Heading ${level}`
    }
    return "Normal"
  })()

  return (
    <Popover>
      <PopoverTrigger className="flex h-8 w-32 shrink-0 items-center justify-between rounded-md px-2 text-sm transition-colors hover:bg-muted">
        <span className="truncate">{current}</span>
        <ChevronDownIcon className="ml-1 size-3.5 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-44 gap-1 p-1" align="start" sideOffset={8}>
        {headings.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => {
              if (value === 0) {
                editor?.chain().focus().setParagraph().run()
              } else {
                editor
                  ?.chain()
                  .focus()
                  .toggleHeading({ level: value as 1 | 2 | 3 })
                  .run()
              }
            }}
            className={cn(
              "flex w-full items-center rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted",
              (value === 0 && !editor?.isActive("heading")) ||
                editor?.isActive("heading", { level: value as 1 | 2 | 3 })
                ? "bg-muted font-medium"
                : ""
            )}
          >
            {label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
