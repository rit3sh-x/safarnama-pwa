import type { Doc } from "./betterAuth/_generated/dataModel";

export type { Auth, Session } from "./betterAuth/auth";
export type User = Doc<"user">;
export type { Category } from "./lib/types";
export type RatingValue = 1 | 2 | 3 | 4 | 5;
