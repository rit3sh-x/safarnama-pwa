import { useEffect, useRef } from "react";
import gsap from "gsap";

interface CrowdCanvasProps {
    src: string;
    rows?: number;
    cols?: number;
}

interface Peep {
    image: HTMLImageElement;
    rect: [number, number, number, number];
    width: number;
    height: number;
    x: number;
    y: number;
    anchorY: number;
    scaleX: number;
    walk: gsap.core.Timeline | null;
}

interface Stage {
    width: number;
    height: number;
}

function randomRange(min: number, max: number) {
    return min + Math.random() * (max - min);
}

function randomIndex<T>(arr: T[]) {
    return (randomRange(0, arr.length) | 0) as number;
}

function removeRandom<T>(arr: T[]): T {
    return arr.splice(randomIndex(arr), 1)[0];
}

function createPeep(
    image: HTMLImageElement,
    rect: [number, number, number, number]
): Peep {
    return {
        image,
        rect,
        width: rect[2],
        height: rect[3],
        x: 0,
        y: 0,
        anchorY: 0,
        scaleX: 1,
        walk: null,
    };
}

const PEEP_SCALE = 0.9;

function renderPeep(ctx: CanvasRenderingContext2D, peep: Peep) {
    ctx.save();
    ctx.translate(peep.x, peep.y);
    ctx.scale(peep.scaleX * PEEP_SCALE, PEEP_SCALE);
    ctx.drawImage(
        peep.image,
        peep.rect[0],
        peep.rect[1],
        peep.rect[2],
        peep.rect[3],
        0,
        0,
        peep.width,
        peep.height
    );
    ctx.restore();
}

function resetPeep(stage: Stage, peep: Peep) {
    const direction = Math.random() > 0.5 ? 1 : -1;
    const offsetY = 100 - 250 * gsap.parseEase("power2.in")(Math.random());
    const startY = stage.height - peep.height + offsetY;

    let startX: number;
    let endX: number;

    if (direction === 1) {
        startX = -peep.width;
        endX = stage.width;
        peep.scaleX = 1;
    } else {
        startX = stage.width + peep.width;
        endX = 0;
        peep.scaleX = -1;
    }

    peep.x = startX;
    peep.y = startY;
    peep.anchorY = startY;

    return { startX, startY, endX };
}

function createWalk(peep: Peep, startY: number, endX: number) {
    const xDuration = 10;
    const yDuration = 0.25;

    const tl = gsap.timeline();
    tl.timeScale(randomRange(0.5, 1.5));
    tl.to(peep, { duration: xDuration, x: endX, ease: "none" }, 0);
    tl.to(
        peep,
        {
            duration: yDuration,
            repeat: xDuration / yDuration,
            yoyo: true,
            y: startY - 10,
        },
        0
    );

    return tl;
}

export function CrowdCanvas({ src, rows = 15, cols = 7 }: CrowdCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const stage: Stage = { width: 0, height: 0 };
        const allPeeps: Peep[] = [];
        const available: Peep[] = [];
        const crowd: Peep[] = [];

        const img = new Image();

        function addToCrowd(): Peep {
            const peep = removeRandom(available);
            const { startY, endX } = resetPeep(stage, peep);

            peep.walk = createWalk(peep, startY, endX).eventCallback(
                "onComplete",
                () => {
                    const idx = crowd.indexOf(peep);
                    if (idx !== -1) crowd.splice(idx, 1);
                    available.push(peep);
                    addToCrowd();
                }
            );

            crowd.push(peep);
            crowd.sort((a, b) => a.anchorY - b.anchorY);
            return peep;
        }

        function render() {
            if (!canvas || !ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.scale(devicePixelRatio, devicePixelRatio);
            for (const peep of crowd) {
                renderPeep(ctx, peep);
            }
            ctx.restore();
        }

        function resize() {
            if (!canvas) return;
            stage.width = canvas.clientWidth;
            stage.height = canvas.clientHeight;
            canvas.width = stage.width * devicePixelRatio;
            canvas.height = stage.height * devicePixelRatio;

            for (const peep of crowd) {
                peep.walk?.kill();
            }
            crowd.length = 0;
            available.length = 0;
            available.push(...allPeeps);

            while (available.length) {
                addToCrowd().walk?.progress(Math.random());
            }
        }

        function init() {
            const { naturalWidth: w, naturalHeight: h } = img;
            const rw = w / rows;
            const rh = h / cols;

            for (let i = 0; i < rows * cols; i++) {
                allPeeps.push(
                    createPeep(img, [
                        (i % rows) * rw,
                        ((i / rows) | 0) * rh,
                        rw,
                        rh,
                    ])
                );
            }

            resize();
            gsap.ticker.add(render);
        }

        img.onload = init;
        img.src = src;

        window.addEventListener("resize", resize);

        return () => {
            window.removeEventListener("resize", resize);
            gsap.ticker.remove(render);
            for (const peep of crowd) {
                peep.walk?.kill();
            }
        };
    }, [src, rows, cols]);

    return (
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    );
}
