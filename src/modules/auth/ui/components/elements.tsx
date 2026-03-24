import { Separator } from "@/components/ui/separator";

export function Divider({ label = "OR" }: { label?: string }) {
    return (
        <div className="my-3 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-sm text-muted-foreground">{label}</span>
            <Separator className="flex-1" />
        </div>
    );
}

interface FooterLinkProps {
    text: string;
    linkText: string;
    onClick: () => void;
}

export function FooterLink({ text, linkText, onClick }: FooterLinkProps) {
    return (
        <div className="mt-8 flex justify-center gap-1">
            <span className="text-sm text-muted-foreground">{text}</span>
            <button
                type="button"
                onClick={onClick}
                className="text-sm font-semibold text-foreground"
            >
                {linkText}
            </button>
        </div>
    );
}

export function AuthContainer({
    children,
    title,
    subtitle,
}: {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
}) {
    return (
        <div className="flex flex-col">
            <h1 className="mb-2 text-left text-3xl font-bold">{title}</h1>

            {subtitle && (
                <p className="mb-8 text-muted-foreground">{subtitle}</p>
            )}

            <div className="flex-1">{children}</div>
        </div>
    );
}
