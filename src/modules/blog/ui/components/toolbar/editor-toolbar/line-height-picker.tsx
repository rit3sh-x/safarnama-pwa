import { ListCollapseIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEditorStore } from "@/modules/blog/hooks/use-editor-store"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const lineHeights = [
  { label: "Default", value: "normal" },
  { label: "Single", value: "1" },
  { label: "1.5", value: "1.5" },
  { label: "Double", value: "2" },
]

export function LineHeightPicker() {
  const { editor } = useEditorStore()

  return (
    <Popover>
      <PopoverTrigger className="flex h-8 min-w-8 items-center justify-center rounded-md transition-colors hover:bg-muted">
        <ListCollapseIcon className="size-4" />
      </PopoverTrigger>
      <PopoverContent className="w-36 gap-1 p-1" align="start" sideOffset={8}>
        {lineHeights.map(({ label, value }) => (
          <button
            key={value}
            onClick={() =>
              editor?.chain().focus().setLineHeight(value).run()
            }
            className={cn(
              "flex w-full items-center rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted",
              editor?.getAttributes("paragraph").lineHeight === value &&
                "bg-muted font-medium"
            )}
          >
            {label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
