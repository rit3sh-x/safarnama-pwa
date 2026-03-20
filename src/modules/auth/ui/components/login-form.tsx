import { z } from "zod"
import { useForm } from "@tanstack/react-form"

import { signInWithEmail, signInWithGoogle } from "../../hooks/auth-handlers"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { AuthContainer, Divider, FooterLink } from "./elements"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const schema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
})

interface LoginFormProps {
  onNavigateSignUp: () => void
}

export function LoginForm({ onNavigateSignUp }: LoginFormProps) {
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      const parsed = schema.safeParse(value)
      if (!parsed.success) return

      await signInWithEmail({
        email: parsed.data.email,
        password: parsed.data.password,
        fetchOptions: {
          onError: ({ error }) => console.error(error),
        },
      })
    },
  })

  return (
    <AuthContainer title="Sign In" subtitle="Welcome back">
      <div className="flex flex-col gap-4">
        <form.Field name="email">
          {(field) => {
            const result = schema.shape.email.safeParse(field.state.value)

            return (
              <Field>
                <FieldLabel>Email</FieldLabel>

                <FieldContent>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="johndoe@gmail.com"
                    type="email"
                  />
                </FieldContent>

                {!result.success && (
                  <FieldError>Enter a valid email</FieldError>
                )}
              </Field>
            )
          }}
        </form.Field>

        <form.Field name="password">
          {(field) => {
            const hasError = field.state.value.length === 0

            return (
              <Field>
                <FieldLabel>Password</FieldLabel>

                <FieldContent>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="••••••••"
                    type="password"
                  />
                </FieldContent>

                {hasError && <FieldError>Password is required</FieldError>}
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
          Sign In
        </Button>

        <Divider />

        <Button
          variant="outline"
          onClick={signInWithGoogle}
          className="h-12 w-full flex-row items-center justify-center gap-2 rounded-lg"
        >
          <img
            src="/auth/google.svg"
            alt="Google"
            className="h-5 w-5 object-contain"
          />
          <p className="font-medium text-foreground">Continue with Google</p>
        </Button>

        <FooterLink
          text="No account?"
          linkText="Sign Up"
          onClick={onNavigateSignUp}
        />
      </div>
    </AuthContainer>
  )
}
