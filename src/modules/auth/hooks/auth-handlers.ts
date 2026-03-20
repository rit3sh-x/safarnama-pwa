import { authClient } from "@/lib/auth-client"

export const signInWithUsername = ({
  password,
  username,
  fetchOptions,
}: {
  username: string
  password: string
  fetchOptions?: {
    onSuccess?: () => void
    onError?: ({ error }: { error: unknown }) => void
  }
}) => {
  return authClient.signIn.username(
    {
      username,
      password,
    },
    {
      ...fetchOptions,
    }
  )
}

export const signInWithEmail = ({
  password,
  email,
  fetchOptions,
}: {
  email: string
  password: string
  fetchOptions?: {
    onSuccess?: () => void
    onError?: ({ error }: { error: unknown }) => void
  }
}) => {
  return authClient.signIn.email(
    {
      email,
      password,
    },
    {
      ...fetchOptions,
    }
  )
}

export const signUpWithEmail = ({
  password,
  email,
  name,
  fetchOptions,
}: {
  email: string
  password: string
  name: string
  fetchOptions?: {
    onSuccess?: () => void
    onError?: ({ error }: { error: unknown }) => void
  }
}) => {
  return authClient.signUp.email(
    {
      email,
      password,
      name,
    },
    {
      ...fetchOptions,
    }
  )
}

export async function signInWithGoogle() {
  return authClient.signIn.social({
    provider: "google",
    callbackURL: "/create-username",
  })
}

export async function changeUsername({
  username,
  imageUrl,
  fetchOptions,
}: {
  username: string
  imageUrl?: string
  fetchOptions?: {
    onSuccess?: () => void
    onError?: ({ error }: { error: unknown }) => void
  }
}) {
  return authClient.updateUser(
    {
      username,
      image: imageUrl,
    },
    {
      ...fetchOptions,
    }
  )
}
