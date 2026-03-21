export type Category =
  | "food"
  | "activity"
  | "transport"
  | "accommodation"
  | "shopping"
  | "other"

export interface RawItem {
  time?: unknown
  duration?: unknown
  category?: unknown
  title?: unknown
  description?: unknown
  location?: unknown
  pricing?: { amount?: unknown; currency?: unknown; note?: unknown }
  weather?: unknown
  tips?: unknown
  imageUrl?: unknown
  imageSource?: unknown
  rating?: unknown
  bookingUrl?: unknown
}

export interface CoercedItem {
  time: string
  duration: string
  category: Category
  title: string
  description: string
  location: string
  pricing: { amount: number; currency: string; note: string }
  weather: string
  tips: string[]
  imageUrl: string
  imageSource?: string
  rating?: number
  bookingUrl?: string
}
