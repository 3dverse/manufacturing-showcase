import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { FIRST_SCENARIO_ID, SCENARIOS } from "@/content/scenarios/scenarios";
import type { ScenarioStep } from "@/content/type";

type ScenarioContextType = {
    isGuidanceVisible: boolean;
    scenarios: typeof SCENARIOS;
    activeScenarioId?: string;
    activeStepId?: string;
    activeStep?: ScenarioStep;
    scenarioActivatedAt?: number;
    pendingIncidentFocusScenarioId?: string;
    setGuidanceVisible: (visible: boolean) => void;
    toggleGuidanceVisibility: () => void;
    activateScenario: (scenarioId: string) => void;
    nextStep: () => void;
    clearActiveScenario: () => void;
    requestIncidentFocus: (scenarioId?: string) => void;
    clearIncidentFocusRequest: () => void;
};

// eslint-disable-next-line react-refresh/only-export-components
export const ScenarioContext = createContext(
    new Proxy({} as ScenarioContextType, {
        get() {
            throw new Error("ScenarioContext must be used within a ScenarioContextProvider");
        },
    }),
);

const hasGuidanceQuery = () => new URLSearchParams(window.location.search).has("guidance");
const getFirstScenarioStepId = (scenarioId?: string) => (scenarioId ? SCENARIOS[scenarioId]?.steps[0]?.id : undefined);

export const ScenarioContextProvider = ({ children }: { children: ReactNode }) => {
    const [isGuidanceVisible, setGuidanceVisible] = useState(() => hasGuidanceQuery());
    const [activeScenarioId, setActiveScenarioId] = useState<string | undefined>(() =>
        hasGuidanceQuery() ? FIRST_SCENARIO_ID : undefined,
    );
    const [activeStepId, setActiveStepId] = useState<string | undefined>(() =>
        hasGuidanceQuery() ? getFirstScenarioStepId(FIRST_SCENARIO_ID) : undefined,
    );
    const [scenarioActivatedAt, setScenarioActivatedAt] = useState<number | undefined>(() =>
        hasGuidanceQuery() ? Date.now() : undefined,
    );
    const [pendingIncidentFocusScenarioId, setPendingIncidentFocusScenarioId] = useState<string | undefined>();
    const activeScenario = activeScenarioId ? SCENARIOS[activeScenarioId] : undefined;
    const activeStep = activeScenario?.steps.find((step) => step.id === activeStepId);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key.toLowerCase() !== "g") return;

            const target = event.target as HTMLElement | null;
            const isTypingTarget =
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target instanceof HTMLSelectElement ||
                Boolean(target?.isContentEditable);

            if (isTypingTarget) return;
            setGuidanceVisible((current) => !current);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const value = useMemo(
        () => ({
            isGuidanceVisible,
            scenarios: SCENARIOS,
            activeScenarioId,
            activeStepId,
            activeStep,
            scenarioActivatedAt,
            pendingIncidentFocusScenarioId,
            setGuidanceVisible,
            toggleGuidanceVisibility: () => setGuidanceVisible((current) => !current),
            activateScenario: (scenarioId: string) => {
                setActiveScenarioId(scenarioId);
                setActiveStepId(getFirstScenarioStepId(scenarioId));
                setScenarioActivatedAt(Date.now());
            },
            nextStep: () => {
                if (!activeScenarioId) return;

                const steps = SCENARIOS[activeScenarioId]?.steps;
                if (!steps?.length) {
                    setActiveStepId(undefined);
                    return;
                }

                setActiveStepId((currentStepId) => {
                    const currentStepIndex = steps.findIndex((step) => step.id === currentStepId);
                    return steps[currentStepIndex + 1]?.id ?? currentStepId ?? steps[0]?.id;
                });
            },
            clearActiveScenario: () => {
                setActiveScenarioId(undefined);
                setActiveStepId(undefined);
                setScenarioActivatedAt(undefined);
                setPendingIncidentFocusScenarioId(undefined);
            },
            requestIncidentFocus: (scenarioId?: string) => {
                setPendingIncidentFocusScenarioId(scenarioId ?? activeScenarioId);
            },
            clearIncidentFocusRequest: () => setPendingIncidentFocusScenarioId(undefined),
        }),
        [
            isGuidanceVisible,
            activeScenarioId,
            activeStepId,
            activeStep,
            scenarioActivatedAt,
            pendingIncidentFocusScenarioId,
        ],
    );

    return <ScenarioContext.Provider value={value}>{children}</ScenarioContext.Provider>;
};
