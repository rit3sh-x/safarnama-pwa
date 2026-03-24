import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import {
    useRive,
    useStateMachineInput,
    Layout,
    Fit,
    Alignment,
    type StateMachineInput,
} from "@rive-app/react-canvas";

type TriggerLike = { fire: () => void };
type ValueLike = { value: boolean | number };

const isTriggerLike = (v: unknown): v is TriggerLike =>
    typeof v === "object" && v !== null && "fire" in v;
const isValueLike = (v: unknown): v is ValueLike =>
    typeof v === "object" && v !== null && "value" in v;

const SEQUENCE = [
    "duckup",
    "Womanright",
    "womanleft",
    "duckdown",
    "cat",
] as const;

const SM = "State Machine 1";
const WINDOW_INTERVAL_MS = 1000;
const FROG_INTERVAL_MS = 1000;
const CAT_RESET_MS = 1000;

export const useAnimation = () => {
    const { rive, RiveComponent } = useRive({
        src: "/onboarding/house.riv",
        stateMachines: SM,
        autoplay: true,
        layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
    });

    const duckUp = useStateMachineInput(rive, SM, "duckup");
    const womanRight = useStateMachineInput(rive, SM, "Womanright");
    const womanLeft = useStateMachineInput(rive, SM, "womanleft");
    const duckDown = useStateMachineInput(rive, SM, "duckdown");
    const frogOn = useStateMachineInput(rive, SM, "Frogtriggeron");
    const windowBool = useStateMachineInput(rive, SM, "Window");
    const catRoom = useStateMachineInput(rive, SM, "catroom.hover");
    const cat = useStateMachineInput(rive, SM, "cat.hover");

    const inputsRef = useRef<(StateMachineInput | null)[]>([]);
    const catRef = useRef<StateMachineInput | null>(null);
    const catRoomRef = useRef<StateMachineInput | null>(null);

    useLayoutEffect(() => {
        inputsRef.current = [duckUp, womanRight, womanLeft, duckDown];
    }, [duckUp, womanRight, womanLeft, duckDown]);

    useLayoutEffect(() => {
        catRef.current = cat ?? null;
        catRoomRef.current = catRoom ?? null;
    }, [cat, catRoom]);

    const currentSequenceIndexRef = useRef(0);

    const invokeTrigger = useCallback(() => {
        const isLast = currentSequenceIndexRef.current === SEQUENCE.length - 1;

        if (isLast) {
            if (isValueLike(catRef.current)) catRef.current.value = true;
            if (isValueLike(catRoomRef.current))
                catRoomRef.current.value = true;
            setTimeout(() => {
                if (isValueLike(catRef.current)) catRef.current.value = false;
                if (isValueLike(catRoomRef.current))
                    catRoomRef.current.value = false;
            }, CAT_RESET_MS);
        } else {
            const input = inputsRef.current[currentSequenceIndexRef.current];
            if (isTriggerLike(input)) input.fire();
        }

        currentSequenceIndexRef.current =
            (currentSequenceIndexRef.current + 1) % SEQUENCE.length;
    }, []);

    useEffect(() => {
        if (!rive) return;

        const windowInterval = setInterval(() => {
            if (isValueLike(windowBool)) windowBool.value = !windowBool.value;
        }, WINDOW_INTERVAL_MS);

        const frogInterval = setInterval(() => {
            if (isTriggerLike(frogOn)) frogOn.fire();
        }, FROG_INTERVAL_MS);

        return () => {
            clearInterval(windowInterval);
            clearInterval(frogInterval);
        };
    }, [rive, windowBool, frogOn]);

    const Animation = (
        <div className="pointer-events-none absolute inset-0 z-0">
            <RiveComponent
                width={undefined}
                height={undefined}
                style={{ width: "100%", height: "100%" }}
            />
        </div>
    );

    return { Animation, invokeTrigger };
};
