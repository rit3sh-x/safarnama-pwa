import { useCallback, useState } from "react";
import { motion, useReducedMotion, cubicBezier } from "framer-motion";
import { Loader2Icon, ArrowLeftIcon } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
    InputOTPSeparator,
} from "@/components/ui/input-otp";
import { AuthContainer } from "../components/elements";

export function TwoFactorView() {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const prefersReducedMotion = useReducedMotion();

    const motionProps = prefersReducedMotion
        ? {}
        : {
              initial: { opacity: 0, y: 40 } as const,
              animate: { opacity: 1, y: 0 } as const,
              transition: { duration: 0.5, ease: cubicBezier(0.16, 1, 0.3, 1) },
          };

    const imgMotionProps = prefersReducedMotion
        ? {}
        : {
              initial: { opacity: 0, scale: 0.9 } as const,
              animate: { opacity: 1, scale: 1 } as const,
              transition: {
                  duration: 0.6,
                  delay: 0.2,
                  ease: "easeOut" as const,
              },
          };

    const verify = useCallback(async (value: string) => {
        if (value.length < 6) return;
        setLoading(true);
        try {
            const { error } = await authClient.twoFactor.verifyTotp({
                code: value.toString().padStart(6, "0"),
                trustDevice: false,
            });
            if (error) {
                toast.error(error.message ?? "Invalid code, please try again.");
                setCode("");
                return;
            }
        } catch {
            toast.error("Verification failed. Please try again.");
            setCode("");
        } finally {
            setLoading(false);
        }
    }, []);

    const handleVerify = useCallback(() => {
        verify(code);
    }, [code, verify]);

    return (
        <div className="grid h-full grid-cols-1 md:grid-cols-2">
            <motion.div
                {...motionProps}
                className="flex h-full w-full items-center justify-center p-6"
            >
                <div className="w-full max-w-md">
                    <AuthContainer
                        title="Two-Factor Verification"
                        subtitle="Enter the 6-digit code from your authenticator app"
                    >
                        <div className="flex flex-col gap-6">
                            <div className="flex justify-center">
                                <InputOTP
                                    maxLength={6}
                                    value={code}
                                    onChange={setCode}
                                    onComplete={verify}
                                    disabled={loading}
                                    autoFocus
                                >
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                    </InputOTPGroup>
                                    <InputOTPSeparator />
                                    <InputOTPGroup>
                                        <InputOTPSlot index={3} />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>

                            <Button
                                onClick={handleVerify}
                                disabled={loading || code.length < 6}
                                size="lg"
                                className="gap-2 rounded-lg"
                            >
                                {loading && (
                                    <Loader2Icon className="size-4 animate-spin" />
                                )}
                                Verify
                            </Button>

                            <p className="text-center text-xs text-muted-foreground">
                                Open your authenticator app to view your
                                verification code.
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate({
                                        to: "/signin",
                                        replace: true,
                                    })
                                }
                                className="inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                            >
                                <ArrowLeftIcon className="size-3.5" />
                                Back to sign in
                            </button>
                        </div>
                    </AuthContainer>
                </div>
            </motion.div>

            <div className="hidden items-center justify-center p-12 md:flex">
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-blue-600">
                    <motion.img
                        src="/auth/hiking.svg"
                        alt="Hiking"
                        className="max-h-96 w-full object-contain"
                        {...imgMotionProps}
                    />
                </div>
            </div>
        </div>
    );
}
