import { z } from "zod"
import { useForm } from "@tanstack/react-form"
import { useCallback, useRef, useState } from "react"
import Cropper, { type Area } from "react-easy-crop"
import { CameraIcon } from "lucide-react"
import { cn } from "@/lib/utils"

import { changeUsername } from "../../hooks/auth-handlers"
import { useUploadFileToConvex } from "@/lib/utils"
import { AuthContainer } from "./elements"
import { MAX_FILE_SIZE } from "@/lib/constants"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const schema = z.object({
  username: z
    .string()
    .min(3, "At least 3 characters")
    .max(20, "Max 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscores only"),
})

function getCroppedImage(imageSrc: string, crop: Area): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = crop.width
      canvas.height = crop.height
      const ctx = canvas.getContext("2d")
      if (!ctx) return reject(new Error("Canvas context unavailable"))

      ctx.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height
      )

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error("Failed to create blob"))
        },
        "image/jpeg",
        0.85
      )
    }
    image.onerror = reject
    image.crossOrigin = "anonymous"
    image.src = imageSrc
  })
}

export function UsernameForm() {
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null)
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const [rawImage, setRawImage] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadFile = useUploadFileToConvex()

  const form = useForm({
    defaultValues: {
      username: "",
    },
    onSubmit: async ({ value }) => {
      const parsed = schema.safeParse(value)
      if (!parsed.success) return

      setImageError(null)
      try {
        let imageUrl: string | undefined

        if (croppedBlob) {
          if (croppedBlob.size > MAX_FILE_SIZE) {
            setImageError("Image must be under 1 MB")
            return
          }

          const file = new File([croppedBlob], "avatar.jpg", {
            type: "image/jpeg",
          })
          const { url } = await uploadFile(file)
          imageUrl = url ?? undefined
        }

        await changeUsername({
          username: parsed.data.username,
          imageUrl,
          fetchOptions: {
            onError: ({ error }) => {
              console.error(error)
              setImageError("Failed to upload image")
            },
          },
        })
      } catch (error) {
        console.error("Submit failed:", error)
        setImageError("Something went wrong. Please try again.")
      }
    },
  })

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null)
    const file = e.target.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    setRawImage(url)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCropDialogOpen(true)

    e.target.value = ""
  }

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedArea(croppedPixels)
  }, [])

  const handleCropConfirm = async () => {
    if (!rawImage || !croppedArea) return

    try {
      const blob = await getCroppedImage(rawImage, croppedArea)
      setCroppedBlob(blob)
      setCroppedPreview(URL.createObjectURL(blob))
    } catch {
      setImageError("Failed to crop image")
    } finally {
      setCropDialogOpen(false)
      if (rawImage) URL.revokeObjectURL(rawImage)
      setRawImage(null)
    }
  }

  return (
    <AuthContainer
      title="Pick a username"
      subtitle="This is how others will find you"
    >
      <div className="flex flex-col gap-4">
        <div className="mb-2 flex flex-col items-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 bg-muted",
              imageError ? "border-destructive" : "border-border"
            )}
          >
            {croppedPreview ? (
              <img
                src={croppedPreview}
                alt="Avatar preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <CameraIcon className="size-8 text-muted-foreground" />
            )}
          </button>

          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileSelect}
            className="hidden"
          />

          <p className="mt-2 text-sm text-muted-foreground">
            Add a photo (optional)
          </p>

          {imageError && (
            <p className="mt-1 text-center text-sm text-destructive">
              {imageError}
            </p>
          )}
        </div>

        <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Crop your photo</DialogTitle>
            </DialogHeader>

            <div className="relative h-64 w-full">
              {rawImage && (
                <Cropper
                  image={rawImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCropDialogOpen(false)
                  if (rawImage) URL.revokeObjectURL(rawImage)
                  setRawImage(null)
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCropConfirm}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <form.Field name="username">
          {(field) => {
            const result = schema.shape.username.safeParse(field.state.value)

            return (
              <Field>
                <FieldLabel>Username</FieldLabel>

                <FieldContent>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. cool_user42"
                    type="text"
                    autoComplete="off"
                  />
                </FieldContent>

                <FieldDescription>
                  3-20 characters, letters, numbers, underscores
                </FieldDescription>

                {!result.success && field.state.value.length > 0 && (
                  <FieldError>{result.error.issues[0]?.message}</FieldError>
                )}
              </Field>
            )
          }}
        </form.Field>

        <Button
          onClick={form.handleSubmit}
          disabled={form.state.isSubmitting}
          size={"lg"}
          className={"mt-2 rounded-lg"}
        >
          Save
        </Button>
      </div>
    </AuthContainer>
  )
}
