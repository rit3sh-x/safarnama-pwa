import { Dialog, DialogContent } from "@/components/ui/dialog"
import { WifiOffIcon } from "lucide-react"
import { useEffect, useState } from "react"

export function NetworkModal() {
  const [isConnected, setIsConnected] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  )

  useEffect(() => {
    const handleOnline = () => setIsConnected(true)
    const handleOffline = () => setIsConnected(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return (
    <Dialog open={!isConnected}>
      <DialogContent className="flex max-w-sm flex-col items-center gap-4 rounded-2xl p-6 shadow-xl shadow-black/20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <WifiOffIcon className="size-8 text-destructive" />
        </div>

        <div className="flex flex-col gap-2 text-center">
          <p className="text-xl font-semibold text-foreground">
            No Internet Connection
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Please check your internet connection and try again. Some features
            may not be available while offline.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
