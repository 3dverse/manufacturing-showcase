//------------------------------------------------------------------------------
import { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { faAngleLeft } from "@fortawesome/pro-solid-svg-icons";

//------------------------------------------------------------------------------
import Button from "@/components/common/Button";
import { Icon } from "@/components/common/Icon";

//------------------------------------------------------------------------------
import { ScenarioContext } from "@/contexts/ScenariosContext";
import { useNavigate } from "@/hooks/useNavigate";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
type TargetPosition = {
    x: number;
    y: number;
};

type ElementBounds = TargetPosition & {
    width: number;
    height: number;
};

//------------------------------------------------------------------------------
const AUTOPLAY_DELAY_MS = 4000;
const POPOVER_MARGIN = 16;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

//------------------------------------------------------------------------------
export const ScenarioStepper = () => {
    //--------------------------------------------------------------------------
    const {
        tutorialMode,
        scenarios,
        activeScenarioId,
        activeStep,
        isScenarioAutoplaying,
        setScenarioAutoplaying,
        prevStep,
        nextStep,
        clearActiveScenario,
    } = useContext(ScenarioContext);
    const navigate = useNavigate();
    const overlayRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLElement>(null);
    const [targetPosition, setTargetPosition] = useState<TargetPosition | undefined>();
    const [autoplayProgress, setAutoplayProgress] = useState(0);
    const [overlayBounds, setOverlayBounds] = useState<ElementBounds>({ x: 0, y: 0, width: 0, height: 0 });
    const [popoverSize, setPopoverSize] = useState({ width: 0, height: 0 });
    const isActiveStepRoute =
        !activeStep?.route ||
        (activeStep.beforeStep
            ? window.location.pathname.startsWith(activeStep.route)
            : window.location.pathname === activeStep.route);
    const scenarioEntries = Object.entries(scenarios);
    const activeScenarioIndex = scenarioEntries.findIndex(([scenarioId]) => scenarioId === activeScenarioId);
    const activeScenario = activeScenarioId ? scenarios[activeScenarioId] : undefined;
    const activeStepIndex = activeScenario?.steps.findIndex((step) => step.id === activeStep?.id) ?? -1;
    const isFirstStep = activeStepIndex <= 0;
    const nextScenario = scenarioEntries[activeScenarioIndex + 1]?.[1];
    const isLastStep = Boolean(activeScenario?.steps.length && activeStepIndex === activeScenario.steps.length - 1);
    const nextButtonLabel = isLastStep ? (nextScenario ? nextScenario.title : "Close") : "Next";

    //--------------------------------------------------------------------------
    const popoverPosition = targetPosition
        ? {
            x: clamp(
                targetPosition.x - overlayBounds.x + (activeStep?.offsetX ?? 0),
                POPOVER_MARGIN,
                Math.max(POPOVER_MARGIN, overlayBounds.width - popoverSize.width - POPOVER_MARGIN),
            ),
            y: clamp(
                targetPosition.y - overlayBounds.y + (activeStep?.offsetY ?? 0),
                POPOVER_MARGIN,
                Math.max(POPOVER_MARGIN, overlayBounds.height - popoverSize.height - POPOVER_MARGIN),
            ),
        }
        : { x: POPOVER_MARGIN, y: POPOVER_MARGIN };

    //--------------------------------------------------------------------------
    const updateTargetPosition = useCallback(() => {
        if (!isActiveStepRoute || !activeStep?.selector) {
            setTargetPosition(undefined);
            return;
        }

        const target = document.querySelector(activeStep.selector);
        if (!target) {
            setTargetPosition(undefined);
            return;
        }

        const rect = target.getBoundingClientRect();
        setTargetPosition({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
        });
    }, [activeStep, isActiveStepRoute]);

    //--------------------------------------------------------------------------
    const updateOverlayMeasurements = useCallback(() => {
        const overlayRect = overlayRef.current?.getBoundingClientRect();
        const popoverRect = popoverRef.current?.getBoundingClientRect();

        if (overlayRect) {
            setOverlayBounds({
                x: overlayRect.left,
                y: overlayRect.top,
                width: overlayRect.width,
                height: overlayRect.height,
            });
        }

        if (popoverRect) {
            setPopoverSize({
                width: popoverRect.width,
                height: popoverRect.height,
            });
        }
    }, []);

    //--------------------------------------------------------------------------
    useLayoutEffect(() => {
        updateTargetPosition();
    }, [updateTargetPosition]);

    //--------------------------------------------------------------------------
    useEffect(() => {
        if (activeStep?.route && !isActiveStepRoute) {
            navigate(activeStep.route);
        }
    }, [activeStep, isActiveStepRoute, navigate]);

    //--------------------------------------------------------------------------
    useEffect(() => {
        window.addEventListener("resize", updateTargetPosition);
        window.addEventListener("scroll", updateTargetPosition, true);

        return () => {
            window.removeEventListener("resize", updateTargetPosition);
            window.removeEventListener("scroll", updateTargetPosition, true);
        };
    }, [updateTargetPosition]);

    //--------------------------------------------------------------------------
    useLayoutEffect(() => {
        updateOverlayMeasurements();

        const resizeObserver = new ResizeObserver(updateOverlayMeasurements);
        if (overlayRef.current) resizeObserver.observe(overlayRef.current);
        if (popoverRef.current) resizeObserver.observe(popoverRef.current);

        window.addEventListener("resize", updateOverlayMeasurements);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", updateOverlayMeasurements);
        };
    }, [updateOverlayMeasurements, activeStep]);

    //--------------------------------------------------------------------------
    useEffect(() => {
        if (!isScenarioAutoplaying || !activeStep) {
            setAutoplayProgress(0);
            return;
        }

        let animationFrame = 0;
        const startedAt = performance.now();

        const updateProgress = (timestamp: number) => {
            const progress = Math.min(((timestamp - startedAt) / AUTOPLAY_DELAY_MS) * 100, 100);
            setAutoplayProgress(progress);

            if (progress >= 100) {
                setAutoplayProgress(0);
                nextStep();
                return;
            }

            animationFrame = window.requestAnimationFrame(updateProgress);
        };

        animationFrame = window.requestAnimationFrame(updateProgress);

        return () => window.cancelAnimationFrame(animationFrame);
    }, [isScenarioAutoplaying, activeStep, nextStep]);

    //--------------------------------------------------------------------------
    if (!tutorialMode || !activeScenarioId || !activeStep || !isActiveStepRoute) return null;
    return (
        <div ref={overlayRef} className="absolute inset-0 z-100">
            <div
                aria-hidden
                className="fixed -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_9999px_color-mix(in_oklch,var(--color-slate-1000)_15%,transparent)] pointer-events-auto starting:opacity-0 opacity-100 starting:scale-200 scale-100 transition-all duration-400"
                style={{
                    left: targetPosition?.x ?? activeStep?.left ?? 0,
                    top: targetPosition?.y ?? activeStep?.top ?? 0,
                    width: activeStep?.circleSize ?? 150,
                    height: activeStep?.circleSize ?? 100,
                }}
            />
            <section
                ref={popoverRef}
                data-theme="dark"
                className="absolute w-[min(calc(100vw-2rem),24rem)] rounded-lg bg-slate-0 px-5 pt-3 pb-4 text-default shadow-xl starting:opacity-0 starting:translate-y-2 opacity-100 translate-y-0 transition-all duration-400"
                style={
                    {
                        left: `${popoverPosition.x}px`,
                        top: `${popoverPosition.y}px`,
                    } as React.CSSProperties
                }
            >
                <div className="flex justify-between items-center mb-2">
                    <p className="grow text-2xs uppercase tracking-wide text-guidance-600">
                        {activeScenario?.title}. Step {activeStepIndex + 1}
                    </p>
                    <Button
                        variant="ghost"
                        colorScheme="neutral"
                        size="2xs"
                        className={cn(
                            isScenarioAutoplaying
                                ? "text-guidance-600"
                                : "opacity-50 hover:opacity-100 transition-opacity duration-200",
                        )}
                        onClick={() => setScenarioAutoplaying((current) => !current)}
                    >
                        Autoplay
                    </Button>
                    <Button variant="ghost" colorScheme="neutral" size="2xs" onClick={clearActiveScenario}>
                        Close
                    </Button>
                </div>
                <h2 className="text-lg font-semibold mb-1">{activeStep.title}</h2>
                <div className="text-sm text-subtle mb-7">{activeStep.description}</div>
                <div className="flex gap-2">
                    {!isFirstStep && (
                        <Button variant="soft" colorScheme="guidance" size="sm" className="px-2" onClick={prevStep}>
                            <Icon icon={faAngleLeft} size="sm" />
                        </Button>
                    )}
                    <Button
                        type="button"
                        colorScheme="guidance"
                        size="sm"
                        className={cn("relative w-full overflow-hidden text-left", isLastStep && nextScenario && "justify-start")}
                        onClick={nextStep}
                    >
                        <span
                            aria-hidden
                            className="absolute inset-y-0 left-0 bg-guidance-600"
                            style={{ width: `${autoplayProgress}%` }}
                        />
                        <span className="relative">
                            {isLastStep && nextScenario && <span className="text-xs block font-semibold">Next scenario</span>}
                            <span>{nextButtonLabel}</span>
                        </span>
                    </Button>
                </div>
            </section>
        </div>
    );
};
