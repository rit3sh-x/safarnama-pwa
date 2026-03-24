import { createContext } from "react";
import type { User } from "@backend/types";

export interface AuthenticationContextValue {
    isLoading: boolean;
    isAuthenticated: boolean;
    hasUsername: boolean;
    showOnboarding: boolean;
    showAuth: boolean;
    showUsername: boolean;
    showHome: boolean;
    user: User | null;
}

export const AuthenticationContext =
    createContext<AuthenticationContextValue | null>(null);
