//------------------------------------------------------------------------------
import { useCallback, useContext, useEffect, useLayoutEffect, useState } from "react";
import { faAngleLeft } from "@fortawesome/pro-light-svg-icons";

//------------------------------------------------------------------------------
import Button from "@/components/common/Button";
import { Icon } from "@/components/common/Icon";

//------------------------------------------------------------------------------
import { ScenarioContext } from "@/contexts/ScenariosContext";
import { useNavigate } from "@/hooks/useNavigate";

//------------------------------------------------------------------------------
type TargetPosition = {
    x: number;
    y: number;
};

//------------------------------------------------------------------------------
export const ScenarioStepper = () => {
    //--------------------------------------------------------------------------
    const { tutorialMode, scenarios, activeScenarioId, activeStep, prevStep, nextStep } = useContext(ScenarioContext);
    const navigate = useNavigate();
    const [targetPosition, setTargetPosition] = useState<TargetPosition | undefined>();
    const isActiveStepRoute = !activeStep?.route || window.location.pathname === activeStep.route;
    const scenarioEntries = Object.entries(scenarios);
    const activeScenarioIndex = scenarioEntries.findIndex(([scenarioId]) => scenarioId === activeScenarioId);
    const activeScenario = activeScenarioId ? scenarios[activeScenarioId] : undefined;
    const activeStepIndex = activeScenario?.steps.findIndex((step) => step.id === activeStep?.id) ?? -1;
    const isFirstStep = activeStepIndex <= 0;
    const nextScenario = scenarioEntries[activeScenarioIndex + 1]?.[1];
    const isLastStep = Boolean(activeScenario?.steps.length && activeStepIndex === activeScenario.steps.length - 1);
    const nextButtonLabel = isLastStep && nextScenario ? `Next Scenario: ${nextScenario.title}` : "Next";

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
    if (!tutorialMode || !activeScenarioId || !activeStep || !isActiveStepRoute) return null;
    return (
        <div className="absolute inset-0 z-100">
            {targetPosition && (
                <div
                    aria-hidden
                    className="fixed -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_9999px_color-mix(in_oklch,var(--color-slate-1000)_15%,transparent)] pointer-events-none"
                    style={{
                        left: targetPosition.x,
                        top: targetPosition.y,
                        width: activeStep?.circleSize ?? 150,
                        height: activeStep?.circleSize ?? 100,
                    }}
                />
            )}

            <section
                data-theme="dark"
                className="absolute w-[min(calc(100vw-2rem),22rem)] rounded-lg bg-slate-0 p-5 text-default shadow-xl"
                style={
                    {
                        left: (targetPosition?.x ?? 0) - 20 + "px",
                        top: (targetPosition?.y ?? 0) + 50 + "px",
                    } as React.CSSProperties
                }
            >
                <p className="text-2xs uppercase tracking-wide text-guidance-600 mb-2">
                    {activeScenario?.title}. Step {activeStepIndex + 1}
                </p>
                <h2 className="text-lg font-semibold mb-1">{activeStep.title}</h2>
                <div className="text-sm text-muted mb-5">{activeStep.description}</div>
                <div className="flex gap-2">
                    {!isFirstStep && (
                        <Button variant="ghost" colorScheme="guidance" size="sm" className="px-2" onClick={prevStep}>
                            <Icon icon={faAngleLeft} size="sm" />
                        </Button>
                    )}
                    <Button type="button" colorScheme="guidance" size="sm" className="w-full" onClick={nextStep}>
                        {nextButtonLabel}
                    </Button>
                </div>
            </section>
        </div>
    );
};
