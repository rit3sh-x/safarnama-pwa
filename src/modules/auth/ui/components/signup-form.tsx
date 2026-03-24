import { z } from "zod";
import { useForm } from "@tanstack/react-form";

import { signInWithGoogle, signUpWithEmail } from "../../hooks/auth-handlers";
import {
    Field,
    FieldContent,
    FieldError,
    FieldLabel,
} from "@/components/ui/field";
import { AuthContainer, Divider, FooterLink } from "./elements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

interface SignUpFormProps {
    onNavigateLogin: () => void;
}

export function SignUpForm({ onNavigateLogin }: SignUpFormProps) {
    const form = useForm({
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
        onSubmit: async ({ value }) => {
            const parsed = schema.safeParse(value);
            if (!parsed.success) return;

            await signUpWithEmail({
                name: parsed.data.name,
                email: parsed.data.email,
                password: parsed.data.password,
                fetchOptions: {
                    onError: ({ error }) => console.error(error),
                },
            });
        },
    });

    return (
        <AuthContainer title="Sign Up" subtitle="Create an account, it's free">
            <div className="flex flex-col gap-4">
                <form.Field name="name">
                    {(field) => {
                        const result = schema.shape.name.safeParse(
                            field.state.value
                        );

                        return (
                            <Field>
                                <FieldLabel>Name</FieldLabel>

                                <FieldContent>
                                    <Input
                                        value={field.state.value}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        placeholder="John Doe"
                                        type="text"
                                    />
                                </FieldContent>

                                {!result.success && (
                                    <FieldError>
                                        Name must be at least 2 characters
                                    </FieldError>
                                )}
                            </Field>
                        );
                    }}
                </form.Field>

                <form.Field name="email">
                    {(field) => {
                        const result = schema.shape.email.safeParse(
                            field.state.value
                        );

                        return (
                            <Field>
                                <FieldLabel>Email</FieldLabel>

                                <FieldContent>
                                    <Input
                                        value={field.state.value}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        placeholder="johndoe@gmail.com"
                                        type="email"
                                    />
                                </FieldContent>

                                {!result.success && (
                                    <FieldError>Enter a valid email</FieldError>
                                )}
                            </Field>
                        );
                    }}
                </form.Field>

                <form.Field name="password">
                    {(field) => {
                        const result = schema.shape.password.safeParse(
                            field.state.value
                        );

                        return (
                            <Field>
                                <FieldLabel>Password</FieldLabel>

                                <FieldContent>
                                    <Input
                                        value={field.state.value}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        placeholder="••••••••"
                                        type="password"
                                    />
                                </FieldContent>

                                {!result.success && (
                                    <FieldError>
                                        Password must be at least 8 characters
                                    </FieldError>
                                )}
                            </Field>
                        );
                    }}
                </form.Field>

                <Button
                    onClick={form.handleSubmit}
                    disabled={form.state.isSubmitting}
                    size={"lg"}
                    className={"mt-2 rounded-lg"}
                >
                    Sign Up
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
                    <p className="font-medium text-foreground">
                        Continue with Google
                    </p>
                </Button>

                <FooterLink
                    text="Have account?"
                    linkText="Sign In"
                    onClick={onNavigateLogin}
                />
            </div>
        </AuthContainer>
    );
}
