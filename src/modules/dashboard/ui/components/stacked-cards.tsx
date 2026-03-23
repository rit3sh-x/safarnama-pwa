import { useRef, useCallback, useImperativeHandle, forwardRef } from "react";
import { motion, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

const PANEL_COUNT = 22;
const WAVE_SPRING = { stiffness: 160, damping: 22, mass: 0.6 };
const SCENE_SPRING = { stiffness: 80, damping: 22, mass: 1 };
const Z_SPREAD = 42;
const SIGMA = 2.8;

const PANEL_IMAGES = [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80",
    "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=400&q=80",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&q=80",
    "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=80",
    "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&q=80",
    "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=400&q=80",
    "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=400&q=80",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80",
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400&q=80",
    "https://images.unsplash.com/photo-1510784722466-f2aa240c3c4a?w=400&q=80",
    "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=400&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=80",
    "https://images.unsplash.com/photo-1540390769625-2fc3f8b1d50c?w=400&q=80",
    "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80",
    "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&q=80",
    "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&q=80",
    "https://images.unsplash.com/photo-1490682143684-14369e18dce8?w=400&q=80",
    "https://images.unsplash.com/photo-1501696461415-6bd6660c6742?w=400&q=80",
    "https://images.unsplash.com/photo-1445962125599-30f582ac21f4?w=400&q=80",
    "https://images.unsplash.com/photo-1455156218388-5e61b526818b?w=400&q=80",
    "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400&q=80",
];

const GRADIENT_OVERLAYS = [
    "linear-gradient(135deg, rgba(99,55,255,0.55) 0%, rgba(236,72,153,0.45) 100%)",
    "linear-gradient(135deg, rgba(6,182,212,0.55) 0%, rgba(59,130,246,0.45) 100%)",
    "linear-gradient(135deg, rgba(245,158,11,0.55) 0%, rgba(239,68,68,0.45) 100%)",
    "linear-gradient(135deg, rgba(16,185,129,0.45) 0%, rgba(6,182,212,0.55) 100%)",
    "linear-gradient(135deg, rgba(236,72,153,0.55) 0%, rgba(245,158,11,0.45) 100%)",
    "linear-gradient(135deg, rgba(59,130,246,0.55) 0%, rgba(99,55,255,0.45) 100%)",
    "linear-gradient(135deg, rgba(239,68,68,0.45) 0%, rgba(236,72,153,0.55) 100%)",
    "linear-gradient(135deg, rgba(6,182,212,0.45) 0%, rgba(16,185,129,0.55) 100%)",
    "linear-gradient(135deg, rgba(99,55,255,0.45) 0%, rgba(6,182,212,0.55) 100%)",
    "linear-gradient(135deg, rgba(245,158,11,0.45) 0%, rgba(16,185,129,0.55) 100%)",
    "linear-gradient(135deg, rgba(239,68,68,0.55) 0%, rgba(245,158,11,0.45) 100%)",
    "linear-gradient(135deg, rgba(99,55,255,0.55) 0%, rgba(59,130,246,0.45) 100%)",
    "linear-gradient(135deg, rgba(16,185,129,0.55) 0%, rgba(99,55,255,0.45) 100%)",
    "linear-gradient(135deg, rgba(236,72,153,0.45) 0%, rgba(59,130,246,0.55) 100%)",
    "linear-gradient(135deg, rgba(6,182,212,0.55) 0%, rgba(245,158,11,0.45) 100%)",
    "linear-gradient(135deg, rgba(59,130,246,0.45) 0%, rgba(16,185,129,0.55) 100%)",
    "linear-gradient(135deg, rgba(245,158,11,0.55) 0%, rgba(99,55,255,0.45) 100%)",
    "linear-gradient(135deg, rgba(239,68,68,0.45) 0%, rgba(6,182,212,0.55) 100%)",
    "linear-gradient(135deg, rgba(99,55,255,0.45) 0%, rgba(236,72,153,0.55) 100%)",
    "linear-gradient(135deg, rgba(16,185,129,0.45) 0%, rgba(245,158,11,0.55) 100%)",
    "linear-gradient(135deg, rgba(236,72,153,0.55) 0%, rgba(239,68,68,0.45) 100%)",
    "linear-gradient(135deg, rgba(59,130,246,0.55) 0%, rgba(6,182,212,0.45) 100%)",
];

type PanelHandle = { setWave: (v: number) => void; setScale: (v: number) => void };

const Panel = forwardRef<PanelHandle, { index: number; total: number }>(
    ({ index, total }, ref) => {
        const t = index / (total - 1);
        const w = 200 + t * 80;
        const h = 280 + t * 120;

        const waveY = useSpring(0, WAVE_SPRING);
        const scaleY = useSpring(1, WAVE_SPRING);

        useImperativeHandle(ref, () => ({
            setWave: (v) => waveY.set(v),
            setScale: (v) => scaleY.set(v),
        }));

        return (
            <motion.div
                className={cn("absolute rounded-xl pointer-events-none overflow-hidden")}
                style={{
                    width: w,
                    height: h,
                    marginLeft: -w / 2,
                    marginTop: -h / 2,
                    translateZ: (index - (total - 1)) * Z_SPREAD,
                    y: waveY,
                    scaleY,
                    transformOrigin: "bottom center",
                    opacity: 0.25 + t * 0.75,
                }}
            >
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${PANEL_IMAGES[index % PANEL_IMAGES.length]})` }}
                />
                <div
                    className="absolute inset-0"
                    style={{
                        background: GRADIENT_OVERLAYS[index % GRADIENT_OVERLAYS.length],
                        mixBlendMode: "multiply",
                    }}
                />
                <div className="absolute inset-0 bg-linear-to-b from-black/8 to-black/32" />
                <div
                    className="absolute inset-0 rounded-xl box-border"
                    style={{ border: `1px solid rgba(255,255,255,${0.08 + t * 0.22})` }}
                />
            </motion.div>
        );
    }
);

Panel.displayName = "Panel";

export function StackedPanels() {
    const containerRef = useRef<HTMLDivElement>(null);
    const panelRefs = useRef<Array<PanelHandle | null>>(
        Array.from({ length: PANEL_COUNT }, () => null)
    );

    const rotY = useSpring(-42, SCENE_SPRING);
    const rotX = useSpring(18, SCENE_SPRING);

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const cx = (e.clientX - rect.left) / rect.width;
            const cy = (e.clientY - rect.top) / rect.height;

            rotY.set(-42 + (cx - 0.5) * 14);
            rotX.set(18 + (cy - 0.5) * -10);

            const cursorCardPos = cx * (PANEL_COUNT - 1);
            panelRefs.current.forEach((ref, i) => {
                const inf = Math.exp(-(Math.abs(i - cursorCardPos) ** 2) / (2 * SIGMA ** 2));
                ref?.setWave(-inf * 70);
                ref?.setScale(0.35 + inf * 0.65);
            });
        },
        [rotY, rotX]
    );

    const handleMouseLeave = useCallback(() => {
        rotY.set(-42);
        rotX.set(18);
        panelRefs.current.forEach((ref) => {
            ref?.setWave(0);
            ref?.setScale(1);
        });
    }, [rotY, rotX]);

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative w-full h-full flex items-center justify-center select-none"
            style={{ perspective: "900px" }}
        >
            <motion.div
                style={{
                    rotateY: rotY,
                    rotateX: rotX,
                    transformStyle: "preserve-3d",
                    position: "relative",
                    width: 0,
                    height: 0,
                }}
            >
                {Array.from({ length: PANEL_COUNT }).map((_, i) => (
                    <Panel
                        key={i}
                        index={i}
                        total={PANEL_COUNT}
                        ref={(el) => { panelRefs.current[i] = el; }}
                    />
                ))}
            </motion.div>
        </div>
    );
}