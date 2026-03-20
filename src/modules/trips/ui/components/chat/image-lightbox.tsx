import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"

interface ImageLightboxProps {
  src: string | null
  alt?: string
  onClose: () => void
}

export function ImageLightbox({
  src,
  alt = "Image",
  onClose,
}: ImageLightboxProps) {
  if (!src) return null

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = src
    link.download = alt || "image"
    link.target = "_blank"
    link.rel = "noopener noreferrer"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={!!src} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] max-w-[90vw] flex-col items-center gap-4 bg-black/95 p-2 ring-0 sm:max-w-[90vw]"
      >
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="h-9 w-9 rounded-full text-white hover:bg-white/20"
          >
            <Download className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-9 w-9 rounded-full text-white hover:bg-white/20"
          >
            <X className="size-5" />
          </Button>
        </div>
        <img
          src={src}
          alt={alt}
          className="max-h-[85vh] max-w-full rounded-lg object-contain"
        />
      </DialogContent>
    </Dialog>
  )
}
