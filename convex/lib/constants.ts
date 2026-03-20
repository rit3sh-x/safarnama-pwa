import { roleValidator } from "../betterAuth/schema"

export const Owner = roleValidator.members[0]
export const Member = roleValidator.members[1]

export const MAX_FILE_SIZE = 1 * 1024 * 1024

export const LIMITS = {
  MAX_REQUESTS_PER_USER: 100,
  MAX_TRIPS_PER_USER: 50,
}
