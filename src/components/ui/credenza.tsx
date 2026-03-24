import { isValidElement, type ReactNode, type ReactElement } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./dialog";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "./drawer";

interface RootProps {
    children: ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

interface SlotProps {
    children: ReactNode;
    className?: string;
    asChild?: boolean;
}

const Credenza = ({ children, ...props }: RootProps) => {
    const isMobile = useIsMobile();
    const Root = isMobile ? Drawer : Dialog;
    return <Root {...props}>{children}</Root>;
};

const CredenzaTrigger = ({
    className,
    children,
    asChild,
    ...props
}: SlotProps) => {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <DrawerTrigger className={className} asChild={asChild} {...props}>
                {children}
            </DrawerTrigger>
        );
    }

    // base-ui uses `render` prop for element composition instead of `asChild`
    if (asChild && isValidElement(children)) {
        return (
            <DialogTrigger
                className={className}
                render={children as ReactElement}
                {...props}
            />
        );
    }

    return (
        <DialogTrigger className={className} {...props}>
            {children}
        </DialogTrigger>
    );
};

const CredenzaClose = ({
    className,
    children,
    asChild,
    ...props
}: SlotProps) => {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <DrawerClose className={className} asChild={asChild} {...props}>
                {children}
            </DrawerClose>
        );
    }

    // base-ui uses `render` prop for element composition instead of `asChild`
    if (asChild && isValidElement(children)) {
        return (
            <DialogClose
                className={className}
                render={children as ReactElement}
                {...props}
            />
        );
    }

    return (
        <DialogClose className={className} {...props}>
            {children}
        </DialogClose>
    );
};

const CredenzaContent = ({ className, children, ...props }: SlotProps) => {
    const isMobile = useIsMobile();
    const Content = isMobile ? DrawerContent : DialogContent;
    return (
        <Content className={className} {...props}>
            {children}
        </Content>
    );
};

const CredenzaHeader = ({ className, children, ...props }: SlotProps) => {
    const isMobile = useIsMobile();
    const Header = isMobile ? DrawerHeader : DialogHeader;
    return (
        <Header className={className} {...props}>
            {children}
        </Header>
    );
};

const CredenzaTitle = ({ className, children, ...props }: SlotProps) => {
    const isMobile = useIsMobile();
    const Title = isMobile ? DrawerTitle : DialogTitle;
    return (
        <Title className={className} {...props}>
            {children}
        </Title>
    );
};

const CredenzaDescription = ({ className, children, ...props }: SlotProps) => {
    const isMobile = useIsMobile();
    const Description = isMobile ? DrawerDescription : DialogDescription;
    return (
        <Description className={className} {...props}>
            {children}
        </Description>
    );
};

const CredenzaBody = ({ className, children, ...props }: SlotProps) => (
    <div className={cn("px-4 md:px-0", className)} {...props}>
        {children}
    </div>
);

const CredenzaFooter = ({ className, children, ...props }: SlotProps) => {
    const isMobile = useIsMobile();
    const Footer = isMobile ? DrawerFooter : DialogFooter;
    return (
        <Footer className={className} {...props}>
            {children}
        </Footer>
    );
};

export {
    Credenza,
    CredenzaTrigger,
    CredenzaClose,
    CredenzaContent,
    CredenzaHeader,
    CredenzaTitle,
    CredenzaDescription,
    CredenzaBody,
    CredenzaFooter,
};
