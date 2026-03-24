import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProgressDotsProps {
    total: number;
    current: number;
    activeWeight?: number;
    inactiveWeight?: number;
}

export const ProgressDots = ({
    total,
    current,
    activeWeight = 3,
    inactiveWeight = 1,
}: ProgressDotsProps) => {
    return (
        <div className="w-full max-w-xs md:max-w-none">
            <div className="flex w-full items-center gap-1">
                {Array.from({ length: total }).map((_, i) => (
                    <Dot
                        key={i}
                        index={i}
                        current={current}
                        flex={i === current ? activeWeight : inactiveWeight}
                    />
                ))}
            </div>
        </div>
    );
};

interface DotProps {
    index: number;
    current: number;
    flex: number;
}

const Dot = ({ index, current, flex }: DotProps) => {
    const isActive = index === current;

    return (
        <motion.div
            className={cn(
                "h-1 rounded-md",
                isActive ? "bg-blue-800" : "bg-blue-200"
            )}
            animate={{ flexGrow: flex }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
    );
};
