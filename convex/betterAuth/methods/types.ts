import type { Id } from "../_generated/dataModel"

export type Org = {
  id: Id<"organization">
  name: string
  logo?: string | null
  updatedAt: number
}

export type User = {
  id: Id<"user">
  name: string
  image?: string | null
  username: string
}
