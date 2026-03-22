import { ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEditorStore } from "@/modules/blog/hooks/use-editor-store"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const fonts = [
  { label: "Sans (Inter)", value: "Inter Variable" },
  { label: "Serif (Lora)", value: "Lora Variable" },
  { label: "Monospace", value: "monospace" },
]

export function FontFamilyPicker() {
  const { editor } = useEditorStore()

  const currentFont =
    editor?.getAttributes("textStyle").fontFamily || "Inter Variable"
  const displayName =
    fonts.find((f) => f.value === currentFont)?.label ?? "Sans"

  return (
    <Popover>
      <PopoverTrigger className="flex h-8 w-24 shrink-0 items-center justify-between rounded-md px-2 text-sm transition-colors hover:bg-muted">
        <span className="truncate">{displayName}</span>
        <ChevronDownIcon className="ml-1 size-3.5 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-48 gap-1 p-1" align="start" sideOffset={8}>
        {fonts.map(({ label, value }) => (
          <button
            key={value}
            onClick={() =>
              editor?.chain().focus().setFontFamily(value).run()
            }
            style={{ fontFamily: value }}
            className={cn(
              "flex w-full items-center rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted",
              currentFont === value && "bg-muted font-medium"
            )}
          >
            {label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
