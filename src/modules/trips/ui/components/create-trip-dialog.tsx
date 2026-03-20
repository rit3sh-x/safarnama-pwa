import { useCallback, useRef, useState } from "react"
import { useForm } from "@tanstack/react-form"
import Cropper, { type Area } from "react-easy-crop"
import { z } from "zod"
import { CalendarDays, ImagePlus, X } from "lucide-react"
import type { DateRange } from "react-day-picker"
import type { Id } from "@backend/dataModel"
import type { Id as IdAuth } from "@backend/authDataModel"

import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { useUploadFileToConvex } from "@/lib/utils"
import { useCreateTrip } from "../../hooks/use-trips"
import type { Doc } from "@backend/authDataModel"

const schema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  destination: z
    .string()
    .min(1, "Destination is required")
    .max(100, "Destination is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  isPublic: z.boolean(),
})

interface CreateTripDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (data: {
    tripId: Id<"trip">
    orgId: IdAuth<"organization">
    name: string
    logo?: string
    role: Doc<"member">["role"]
  }) => void
}

export function CreateTripDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateTripDialogProps) {
  const { mutate: createTrip, isPending: isCreating } = useCreateTrip()
  const uploadFile = useUploadFileToConvex()

  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const croppedAreaRef = useRef<Area | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm({
    defaultValues: {
      title: "",
      destination: "",
      description: "",
      isPublic: false,
    },
    onSubmit: async ({ value }) => {
      const parsed = schema.safeParse(value)
      if (!parsed.success) return

      setSubmitError(null)
      try {
        const logoUrl = await uploadCoverImage()

        const { tripId, orgId } = await createTrip({
          title: parsed.data.title.trim(),
          destination: parsed.data.destination.trim(),
          description: parsed.data.description?.trim() || undefined,
          logoUrl,
          isPublic: parsed.data.isPublic,
          startDate: dateRange?.from ? dateRange.from.getTime() : undefined,
          endDate: dateRange?.to ? dateRange.to.getTime() : undefined,
        })

        resetAll()
        onOpenChange(false)
        onCreated?.({
          tripId,
          orgId,
          logo: logoUrl,
          name: parsed.data.title.trim(),
          role: "owner",
        })
      } catch (error) {
        console.error("Failed to create trip:", error)
        setSubmitError("Something went wrong. Please try again.")
      }
    },
  })

  const resetAll = useCallback(() => {
    form.reset()
    setCoverPreview(null)
    setCropSrc(null)
    setDateRange(undefined)
    setSubmitError(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    croppedAreaRef.current = null
  }, [form])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const url = URL.createObjectURL(file)
      setCropSrc(url)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      e.target.value = ""
    },
    []
  )

  const onCropComplete = useCallback((_: Area, croppedArea: Area) => {
    croppedAreaRef.current = croppedArea
  }, [])

  const confirmCrop = useCallback(async () => {
    if (!cropSrc || !croppedAreaRef.current) return
    const canvas = document.createElement("canvas")
    const img = new Image()
    img.crossOrigin = "anonymous"

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
      img.src = cropSrc
    })

    const { x, y, width, height } = croppedAreaRef.current
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(img, x, y, width, height, 0, 0, width, height)

    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.85)
    )
    const previewUrl = URL.createObjectURL(blob)

    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverPreview(previewUrl)
    URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }, [cropSrc, coverPreview])

  const cancelCrop = useCallback(() => {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }, [cropSrc])

  async function uploadCoverImage(): Promise<string | undefined> {
    if (!coverPreview) return undefined
    try {
      const response = await fetch(coverPreview)
      const blob = await response.blob()
      const file = new File([blob], "cover.jpg", { type: "image/jpeg" })
      const { url } = await uploadFile(file)
      return url ?? undefined
    } catch (error) {
      console.error("Failed to upload cover image:", error)
      return undefined
    }
  }

  function formatDateLabel(date: Date) {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const isSubmitting = form.state.isSubmitting || isCreating

  return (
    <Credenza
      open={open}
      onOpenChange={(next) => {
        if (!next) resetAll()
        onOpenChange(next)
      }}
    >
      <CredenzaContent className="max-h-[90vh] sm:max-w-lg">
        <CredenzaHeader>
          <CredenzaTitle>New Trip</CredenzaTitle>
          <CredenzaDescription>Plan your next adventure</CredenzaDescription>
        </CredenzaHeader>

        <CredenzaBody className="space-y-4 overflow-y-auto">
          {cropSrc && (
            <div className="space-y-3">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
                <Cropper
                  image={cropSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <Slider
                value={[zoom]}
                onValueChange={(value) =>
                  setZoom(Array.isArray(value) ? (value[0] ?? 1) : value)
                }
                min={1}
                max={3}
                step={0.01}
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={cancelCrop}>
                  Cancel
                </Button>
                <Button size="sm" onClick={confirmCrop}>
                  Crop
                </Button>
              </div>
            </div>
          )}

          {!cropSrc && (
            <Button
              variant="ghost"
              className="flex aspect-video h-auto w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted p-0 hover:bg-muted/80"
              onClick={() => fileInputRef.current?.click()}
            >
              {coverPreview ? (
                <div className="relative h-full w-full">
                  <img
                    src={coverPreview}
                    alt="Cover"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100">
                    <ImagePlus className="size-8 text-white" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImagePlus className="size-8" />
                  <span className="text-sm">Add cover photo</span>
                </div>
              )}
            </Button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            hidden
            aria-hidden
          />

          <form.Field name="title">
            {(field) => {
              const result = schema.shape.title.safeParse(field.state.value)
              const touched = field.state.meta.isTouched
              return (
                <Field>
                  <FieldLabel>Title</FieldLabel>
                  <FieldContent>
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="e.g. Summer Europe Trip"
                    />
                  </FieldContent>
                  {touched && !result.success && (
                    <FieldError>{result.error.issues[0]?.message}</FieldError>
                  )}
                </Field>
              )
            }}
          </form.Field>

          <form.Field name="destination">
            {(field) => {
              const result = schema.shape.destination.safeParse(
                field.state.value
              )
              const touched = field.state.meta.isTouched
              return (
                <Field>
                  <FieldLabel>Destination</FieldLabel>
                  <FieldContent>
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="e.g. Paris, France"
                    />
                  </FieldContent>
                  {touched && !result.success && (
                    <FieldError>{result.error.issues[0]?.message}</FieldError>
                  )}
                </Field>
              )
            }}
          </form.Field>

          <form.Field name="description">
            {(field) => {
              const result = schema.shape.description.safeParse(
                field.state.value
              )
              const touched = field.state.meta.isTouched
              return (
                <Field>
                  <FieldLabel>Description (optional)</FieldLabel>
                  <FieldContent>
                    <Textarea
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="What's this trip about?"
                      rows={3}
                    />
                  </FieldContent>
                  {touched && !result.success && (
                    <FieldError>{result.error.issues[0]?.message}</FieldError>
                  )}
                </Field>
              )
            }}
          </form.Field>

          <Field>
            <FieldLabel>Trip Dates (optional)</FieldLabel>
            <Popover>
              <div className="flex items-center gap-2">
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      className="flex-1 justify-start gap-2 font-normal"
                    />
                  }
                >
                  <CalendarDays className="size-4 text-muted-foreground" />
                  <span className="truncate">
                    {dateRange?.from
                      ? `${formatDateLabel(dateRange.from)}${dateRange.to ? ` – ${formatDateLabel(dateRange.to)}` : ""}`
                      : "Select dates"}
                  </span>
                </PopoverTrigger>
                {dateRange?.from && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setDateRange(undefined)}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  disabled={{ before: new Date() }}
                  numberOfMonths={1}
                />
              </PopoverContent>
            </Popover>
          </Field>

          <form.Field name="isPublic">
            {(field) => (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Public Trip</Label>
                  <p className="text-xs text-muted-foreground">
                    Anyone can view this trip
                  </p>
                </div>
                <Switch
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(!!checked)}
                />
              </div>
            )}
          </form.Field>

          {submitError && (
            <p className="text-center text-sm text-destructive">
              {submitError}
            </p>
          )}
        </CredenzaBody>

        <CredenzaFooter className="flex-row gap-3">
          <CredenzaClose asChild>
            <Button variant="outline" className="flex-1">
              Cancel
            </Button>
          </CredenzaClose>
          <Button
            className="flex-1"
            onClick={form.handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Trip"}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  )
}
