//------------------------------------------------------------------------------
import { useEffect, useRef, useState } from "react";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
type CounterProps = {
    number: number;
    duration?: number; // ms
    className?: string;
};

//------------------------------------------------------------------------------
export const Counter = ({ number, duration = 300, className = "" }: CounterProps) => {
    const digits = number.toString().split("");

    //--------------------------------------------------------------------------
    // Render
    return (
        <span className={cn("flex leading-none", className)}>
            {digits.map((digit, i) => (
                <Digit key={digits.length - i} digit={digit} duration={duration} />
            ))}
        </span>
    );
};

//------------------------------------------------------------------------------
// Three-phase animation avoids the reverse-transition bug that occurred when
// flipping the `animate` boolean while the CSS transition was still active.
//
//  idle     – animation finished; currentDisplay is visible at translateY(0%)
//  prepare  – new digit received; snap both elements to start positions (no transition)
//  animate  – run the CSS transition from start → end positions
type AnimPhase = "idle" | "prepare" | "animate";

//------------------------------------------------------------------------------
const Digit = ({ digit, duration }: { digit: string; duration: number }) => {
    const [prevDisplay, setPrevDisplay] = useState(digit);
    const [currentDisplay, setCurrentDisplay] = useState(digit);
    const [animPhase, setAnimPhase] = useState<AnimPhase>("idle");

    // Ref-based tracking avoids adding display state to the effect dependency
    // array, which would cancel the RAF that starts the animation.
    const lastDigitRef = useRef(digit);
    const rafRef = useRef<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    //--------------------------------------------------------------------------
    // Effects
    useEffect(() => {
        if (digit === lastDigitRef.current) return;

        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        if (timerRef.current !== null) clearTimeout(timerRef.current);

        const outgoing = lastDigitRef.current;
        lastDigitRef.current = digit;

        setPrevDisplay(outgoing);
        setCurrentDisplay(digit);
        setAnimPhase("prepare");

        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            setAnimPhase("animate");
            timerRef.current = setTimeout(() => {
                timerRef.current = null;
                setAnimPhase("idle");
            }, duration);
        });

        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
            if (timerRef.current !== null) clearTimeout(timerRef.current);
        };
    }, [digit, duration]);

    //--------------------------------------------------------------------------
    // Render
    //
    // Phase positions:
    //   idle    → prev: -100% (hidden above), current:   0% (visible)
    //   prepare → prev:    0% (visible),      current: 100% (hidden below) — no transition
    //   animate → prev: -100% (exits up),     current:   0% (enters from below) — with transition
    const isPrepare = animPhase === "prepare";
    const transition = animPhase === "animate" ? `transform ${duration}ms ease` : "none";

    return (
        <span className="relative h-[1em] w-[0.7em] overflow-hidden">
            {/* OUTGOING DIGIT */}
            <span
                className="absolute inset-0 flex items-center justify-center"
                style={{
                    transform: isPrepare ? "translateY(0%)" : "translateY(-100%)",
                    transition,
                }}
            >
                {prevDisplay}
            </span>

            {/* INCOMING DIGIT */}
            <span
                className="absolute inset-0 flex items-center justify-center"
                style={{
                    transform: isPrepare ? "translateY(100%)" : "translateY(0%)",
                    transition,
                }}
            >
                {currentDisplay}
            </span>
        </span>
    );
};
