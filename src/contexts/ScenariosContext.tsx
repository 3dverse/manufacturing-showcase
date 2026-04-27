import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { FIRST_SCENARIO_ID, SCENARIOS } from "@/content/scenarios/scenarios";
import { useNavigationStore } from "@/store/useNavigationStore";
import type { ScenarioStep } from "@/content/type";

type ScenarioContextType = {
    isGuidanceVisible: boolean;
    tutorialMode: boolean;
    scenarios: typeof SCENARIOS;
    activeScenarioId?: string;
    activeStepId?: string;
    activeStep?: ScenarioStep;
    scenarioActivatedAt?: number;
    pendingIncidentFocusScenarioId?: string;
    setGuidanceVisible: (visible: boolean) => void;
    setTutorialMode: (active: boolean) => void;
    toggleGuidanceVisibility: () => void;
    toggleTutorialMode: () => void;
    activateScenario: (scenarioId: string) => void;
    prevStep: () => void;
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
const getNextScenarioId = (scenarioId?: string) => {
    if (!scenarioId) return undefined;

    const scenarioIds = Object.keys(SCENARIOS);
    const scenarioIndex = scenarioIds.indexOf(scenarioId);
    return scenarioIds[scenarioIndex + 1];
};
const navigateToStepRoute = (step?: ScenarioStep) => {
    if (!step?.route || window.location.pathname === step.route) return;
    useNavigationStore.getState().navigate(step.route);
};

export const ScenarioContextProvider = ({ children }: { children: ReactNode }) => {
    const [isGuidanceVisible, setGuidanceVisible] = useState(() => hasGuidanceQuery());
    const [tutorialMode, setTutorialMode] = useState(true);
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
            tutorialMode,
            scenarios: SCENARIOS,
            activeScenarioId,
            activeStepId,
            activeStep,
            scenarioActivatedAt,
            pendingIncidentFocusScenarioId,
            setGuidanceVisible,
            setTutorialMode,
            toggleGuidanceVisibility: () => setGuidanceVisible((current) => !current),
            toggleTutorialMode: () => setTutorialMode((current) => !current),
            activateScenario: (scenarioId: string) => {
                setActiveScenarioId(scenarioId);
                setActiveStepId(getFirstScenarioStepId(scenarioId));
                setScenarioActivatedAt(Date.now());
            },
            prevStep: () => {
                if (!activeScenarioId) return;

                const steps = SCENARIOS[activeScenarioId]?.steps;
                if (!steps?.length) {
                    setActiveStepId(undefined);
                    return;
                }

                const currentStepIndex = steps.findIndex((step) => step.id === activeStepId);
                const prevStep = steps[currentStepIndex - 1];
                if (!prevStep) return;

                navigateToStepRoute(prevStep);
                setActiveStepId(prevStep.id);
            },
            nextStep: () => {
                if (!activeScenarioId) return;

                const steps = SCENARIOS[activeScenarioId]?.steps;
                if (!steps?.length) {
                    setActiveStepId(undefined);
                    return;
                }

                const currentStepIndex = steps.findIndex((step) => step.id === activeStepId);
                const nextStep = steps[currentStepIndex + 1];
                if (nextStep) {
                    navigateToStepRoute(nextStep);
                    setActiveStepId(nextStep.id);
                    return;
                }

                const nextScenarioId = getNextScenarioId(activeScenarioId);
                if (!nextScenarioId) return;
                const firstNextScenarioStep = SCENARIOS[nextScenarioId]?.steps[0];

                navigateToStepRoute(firstNextScenarioStep);
                setActiveScenarioId(nextScenarioId);
                setActiveStepId(firstNextScenarioStep?.id);
                setScenarioActivatedAt(Date.now());
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
            tutorialMode,
            activeScenarioId,
            activeStepId,
            activeStep,
            scenarioActivatedAt,
            pendingIncidentFocusScenarioId,
        ],
    );

    return <ScenarioContext.Provider value={value}>{children}</ScenarioContext.Provider>;
};
