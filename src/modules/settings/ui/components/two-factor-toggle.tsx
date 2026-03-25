import { useCallback, useEffect, useRef, useState } from "react";
import { ShieldCheckIcon, CopyIcon, CheckIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import QRCodeStyling from "qr-code-styling";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
    InputOTPSeparator,
} from "@/components/ui/input-otp";
import {
    Credenza,
    CredenzaBody,
    CredenzaClose,
    CredenzaContent,
    CredenzaDescription,
    CredenzaFooter,
    CredenzaHeader,
    CredenzaTitle,
} from "@/components/ui/credenza";
import { useAuthenticatedUser } from "@/modules/auth/hooks/use-authentication";
import { authClient } from "@/lib/auth-client";
import logoSrc from "@/assets/icon-transparent.svg";

type Step = "idle" | "password" | "qr" | "verify" | "disable-confirm";

export function TwoFactorToggle() {
    const { user } = useAuthenticatedUser();
    const isEnabled = !!user.twoFactorEnabled;

    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<Step>("idle");
    const [password, setPassword] = useState("");
    const [totpURI, setTotpURI] = useState("");
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [copiedBackup, setCopiedBackup] = useState(false);

    const qrRef = useRef<HTMLDivElement>(null);
    const qrInstance = useRef<QRCodeStyling | null>(null);

    const resetState = useCallback(() => {
        setStep("idle");
        setPassword("");
        setTotpURI("");
        setBackupCodes([]);
        setCode("");
        setLoading(false);
        setCopiedBackup(false);
    }, []);

    const handleToggle = useCallback(
        (checked: boolean) => {
            setOpen(true);
            if (checked) {
                setStep("password");
            } else {
                setStep("disable-confirm");
            }
        },
        []
    );

    const handleEnable = useCallback(async () => {
        if (!password.trim()) return;
        setLoading(true);
        try {
            const { data, error } = await authClient.twoFactor.enable({
                password,
                issuer: "Safarnama",
            });
            if (error) {
                toast.error(error.message ?? "Failed to enable 2FA");
                return;
            }
            if (data?.totpURI) {
                setTotpURI(data.totpURI);
                setBackupCodes(data.backupCodes ?? []);
                setStep("qr");
            }
        } catch {
            toast.error("Failed to enable 2FA");
        } finally {
            setLoading(false);
        }
    }, [password]);

    const handleVerify = useCallback(async () => {
        if (code.length < 6) return;
        setLoading(true);
        try {
            const { error } = await authClient.twoFactor.verifyTotp({ code });
            if (error) {
                toast.error(error.message ?? "Invalid code");
                return;
            }
            toast.success("Two-factor authentication enabled");
            setOpen(false);
            resetState();
        } catch {
            toast.error("Verification failed");
        } finally {
            setLoading(false);
        }
    }, [code, resetState]);

    const handleDisable = useCallback(async () => {
        if (!password.trim()) return;
        setLoading(true);
        try {
            const { error } = await authClient.twoFactor.disable({
                password,
            });
            if (error) {
                toast.error(error.message ?? "Failed to disable 2FA");
                return;
            }
            toast.success("Two-factor authentication disabled");
            setOpen(false);
            resetState();
        } catch {
            toast.error("Failed to disable 2FA");
        } finally {
            setLoading(false);
        }
    }, [password, resetState]);

    const copyBackupCodes = useCallback(() => {
        navigator.clipboard.writeText(backupCodes.join("\n"));
        setCopiedBackup(true);
        setTimeout(() => setCopiedBackup(false), 2000);
    }, [backupCodes]);

    useEffect(() => {
        if (!totpURI || step !== "qr") return;

        const qr = new QRCodeStyling({
            width: 240,
            height: 240,
            data: totpURI,
            dotsOptions: {
                type: "rounded",
                color: "#1a1a2e",
            },
            backgroundOptions: {
                color: "#ffffff",
            },
            cornersSquareOptions: {
                type: "extra-rounded",
                color: "#1a1a2e",
            },
            cornersDotOptions: {
                type: "dot",
                color: "#1a1a2e",
            },
            image: logoSrc,
            imageOptions: {
                crossOrigin: "anonymous",
                margin: 4,
                imageSize: 0.35,
            },
        });

        qrInstance.current = qr;

        if (qrRef.current) {
            qrRef.current.innerHTML = "";
            qr.append(qrRef.current);
        }
    }, [totpURI, step]);

    return (
        <>
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">
                    Security
                </h3>
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <ShieldCheckIcon className="size-4 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-medium">
                                Two-Factor Authentication
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {isEnabled
                                    ? "Your account is protected with 2FA"
                                    : "Add an extra layer of security"}
                            </p>
                        </div>
                    </div>
                    <Switch
                        checked={isEnabled}
                        onCheckedChange={handleToggle}
                    />
                </div>
            </div>

            <Credenza
                open={open}
                onOpenChange={(next) => {
                    if (!next) resetState();
                    setOpen(next);
                }}
            >
                <CredenzaContent className="sm:max-w-md">
                    <CredenzaHeader>
                        <CredenzaTitle>
                            {step === "disable-confirm"
                                ? "Disable 2FA"
                                : step === "qr"
                                    ? "Scan QR Code"
                                    : step === "verify"
                                        ? "Verify Code"
                                        : "Enable 2FA"}
                        </CredenzaTitle>
                        <CredenzaDescription>
                            {step === "disable-confirm"
                                ? "Enter your password to disable two-factor authentication."
                                : step === "password"
                                    ? "Enter your password to set up two-factor authentication."
                                    : step === "qr"
                                        ? "Scan this QR code with your authenticator app."
                                        : "Enter the 6-digit code from your authenticator app."}
                        </CredenzaDescription>
                    </CredenzaHeader>

                    <CredenzaBody className="space-y-4">
                        {step !== "disable-confirm" && step !== "idle" && (
                            <div className="flex items-center justify-center gap-1.5">
                                {["password", "qr", "verify"].map((s) => (
                                    <div
                                        key={s}
                                        className={`h-1 w-8 rounded-full transition-colors ${
                                            s === step
                                                ? "bg-primary"
                                                : ["password", "qr", "verify"].indexOf(s) <
                                                    ["password", "qr", "verify"].indexOf(step)
                                                  ? "bg-primary/40"
                                                  : "bg-muted"
                                        }`}
                                    />
                                ))}
                            </div>
                        )}

                        {(step === "password" || step === "disable-confirm") && (
                            <div className="space-y-3">
                                <Input
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            if (step === "disable-confirm") {
                                                handleDisable();
                                            } else {
                                                handleEnable();
                                            }
                                        }
                                    }}
                                    autoFocus
                                />
                            </div>
                        )}

                        {step === "qr" && (
                            <div className="space-y-4">
                                <div className="flex justify-center rounded-lg border border-border/50 bg-white p-4">
                                    <div ref={qrRef} />
                                </div>

                                {backupCodes.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium">
                                                Backup Codes
                                            </p>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 gap-1.5 text-xs"
                                                onClick={copyBackupCodes}
                                            >
                                                {copiedBackup ? (
                                                    <CheckIcon className="size-3" />
                                                ) : (
                                                    <CopyIcon className="size-3" />
                                                )}
                                                {copiedBackup
                                                    ? "Copied"
                                                    : "Copy all"}
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Save these codes in a safe place.
                                            You can use them to sign in if you
                                            lose access to your authenticator.
                                        </p>
                                        <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-muted p-3 font-mono text-xs">
                                            {backupCodes.map((c) => (
                                                <span key={c}>{c}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {step === "verify" && (
                            <div className="flex justify-center">
                                <InputOTP
                                    maxLength={6}
                                    value={code}
                                    onChange={setCode}
                                    onComplete={(value) => {
                                        setCode(value);
                                        handleVerify();
                                    }}
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
                        )}
                    </CredenzaBody>

                    <CredenzaFooter className="flex-row gap-3">
                        <CredenzaClose asChild>
                            <Button variant="outline" className="flex-1">
                                Cancel
                            </Button>
                        </CredenzaClose>

                        {step === "password" && (
                            <Button
                                className="flex-1 gap-2"
                                onClick={handleEnable}
                                disabled={loading || !password.trim()}
                            >
                                {loading && (
                                    <Loader2Icon className="size-4 animate-spin" />
                                )}
                                Continue
                            </Button>
                        )}

                        {step === "qr" && (
                            <Button
                                className="flex-1"
                                onClick={() => setStep("verify")}
                            >
                                Next
                            </Button>
                        )}

                        {step === "verify" && (
                            <Button
                                className="flex-1 gap-2"
                                onClick={handleVerify}
                                disabled={loading || code.length < 6}
                            >
                                {loading && (
                                    <Loader2Icon className="size-4 animate-spin" />
                                )}
                                Verify
                            </Button>
                        )}

                        {step === "disable-confirm" && (
                            <Button
                                className="flex-1 gap-2"
                                variant="destructive"
                                onClick={handleDisable}
                                disabled={loading || !password.trim()}
                            >
                                {loading && (
                                    <Loader2Icon className="size-4 animate-spin" />
                                )}
                                Disable 2FA
                            </Button>
                        )}
                    </CredenzaFooter>
                </CredenzaContent>
            </Credenza>
        </>
    );
}
