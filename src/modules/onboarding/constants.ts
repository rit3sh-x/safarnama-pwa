import type { OnboardingScreen } from "./types"

export const USER_ONBOARDING_KEY = "user.onboarding_completed" as const

export const ONBOARDING_SCREENS: OnboardingScreen[] = [
  {
    id: 1,
    headline: "Your Journey Begins Here",
    subtext:
      "Safarnama turns every trip into a living story — plan, explore, and remember.",
  },
  {
    id: 2,
    headline: "Travel Together",
    subtext:
      "Create public or private trips, invite your crew, and plan every detail in one place.",
  },
  {
    id: 3,
    headline: "Split Costs, Not Friendships",
    subtext:
      "Track shared expenses and split trip funds fairly — no awkward money talks.",
  },
  {
    id: 4,
    headline: "Publish Your Adventures",
    subtext:
      "Write travel blogs, share photos, and inspire millions of wanderers worldwide.",
  },
  {
    id: 5,
    headline: "Join a Living Community",
    subtext:
      "Comment, react, and discover hidden gems — a world of travelers waiting for you.",
  },
  {
    id: 6,
    headline: "Every Mile Tells a Story",
    subtext:
      "Interactive maps, real-time updates, and an experience that moves as fast as you do.",
  },
] as const
