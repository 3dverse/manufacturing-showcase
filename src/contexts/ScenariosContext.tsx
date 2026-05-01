import {
    createContext,
    useCallback,
    useEffect,
    useMemo,
    useState,
    type Dispatch,
    type ReactNode,
    type SetStateAction,
} from "react";

import { FIRST_SCENARIO_ID, SCENARIOS, type ScenarioFocus } from "@/content/scenarios/scenarios";
import { useNavigationStore } from "@/store/useNavigationStore";
import { useTimelineStore } from "@/store/useTimelineStore";
import { Router } from "@/core/Router";
import type { ScenarioStep } from "@/content/type";

type ScenarioContextType = {
    isGuidanceVisible: boolean;
    tutorialMode: boolean;
    scenarios: typeof SCENARIOS;
    activeScenarioId?: string;
    activeStepId?: string;
    activeStep?: ScenarioStep;
    activeSteps: ScenarioStep[];
    focus: ScenarioFocus | null;
    scenarioActivatedAt?: number;
    pendingIncidentFocusScenarioId?: string;
    isScenarioAutoplaying: boolean;
    setGuidanceVisible: (visible: boolean) => void;
    setTutorialMode: (active: boolean) => void;
    setScenarioAutoplaying: Dispatch<SetStateAction<boolean>>;
    setFocus: (scenarioId: string, focus: ScenarioFocus | null) => void;
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

const resolveSteps = (scenarioId?: string, focus: ScenarioFocus | null = null): ScenarioStep[] => {
    if (!scenarioId) return [];
    const scenario = SCENARIOS[scenarioId];
    if (!scenario) return [];
    return typeof scenario.steps === "function" ? scenario.steps(focus) : scenario.steps;
};

const getFirstScenarioStepId = (scenarioId?: string) => resolveSteps(scenarioId, null).find((s) => !s.skip)?.id;

const getNextScenarioId = (scenarioId?: string) => {
    if (!scenarioId) return undefined;
    const scenarioIds = Object.keys(SCENARIOS);
    return scenarioIds[scenarioIds.indexOf(scenarioId) + 1];
};

const pushRoute = (route: string) => {
    useNavigationStore.getState().navigate(route);
    const [, factorySlug, nodeSlug, itemSlug] = route.split("/");
    if (factorySlug) Router.replace({ factorySlug, nodeSlug, itemSlug });
};

const navigateToStepRoute = (step?: ScenarioStep) => {
    if (!step) return;
    const primary = step.route;
    if (primary && window.location.pathname !== primary) {
        pushRoute(primary);
    }
    const overrideRoute = step.beforeStep?.();
    if (typeof overrideRoute === "string" && overrideRoute && window.location.pathname !== overrideRoute) {
        pushRoute(overrideRoute);
    }
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
    const [isScenarioAutoplaying, setScenarioAutoplaying] = useState(false);
    const [focusMap, setFocusMap] = useState<Record<string, ScenarioFocus | null>>({});
    const setFocus = useCallback(
        (scenarioId: string, newFocus: ScenarioFocus | null) =>
            setFocusMap((prev) => ({ ...prev, [scenarioId]: newFocus })),
        [],
    );

    const focus = activeScenarioId ? (focusMap[activeScenarioId] ?? null) : null;

    const activeSteps = useMemo(
        () => resolveSteps(activeScenarioId, focus),

        [activeScenarioId, focus],
    );

    const activeStep = useMemo(() => activeSteps.find((s) => s.id === activeStepId), [activeSteps, activeStepId]);

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
            activeSteps,
            focus,
            scenarioActivatedAt,
            pendingIncidentFocusScenarioId,
            isScenarioAutoplaying,
            setGuidanceVisible,
            setTutorialMode,
            setScenarioAutoplaying,
            setFocus,
            toggleGuidanceVisibility: () => setGuidanceVisible((current) => !current),
            toggleTutorialMode: () => setTutorialMode((current) => !current),
            activateScenario: (scenarioId: string) => {
                useTimelineStore.getState().pause();
                setActiveScenarioId(scenarioId);
                setActiveStepId(getFirstScenarioStepId(scenarioId));
                setScenarioActivatedAt(Date.now());
            },
            prevStep: () => {
                if (!activeSteps.length) return;
                const currentIndex = activeSteps.findIndex((s) => s.id === activeStepId);
                const prev = [...activeSteps.slice(0, currentIndex)].reverse().find((s) => !s.skip);
                if (!prev) return;
                navigateToStepRoute(prev);
                setActiveStepId(prev.id);
            },
            nextStep: () => {
                if (!activeSteps.length) return;
                const currentIndex = activeSteps.findIndex((s) => s.id === activeStepId);
                const next = activeSteps.slice(currentIndex + 1).find((s) => !s.skip);
                if (next) {
                    navigateToStepRoute(next);
                    setActiveStepId(next.id);
                    return;
                }

                const nextScenarioId = getNextScenarioId(activeScenarioId);
                if (!nextScenarioId) {
                    setActiveScenarioId(undefined);
                    setActiveStepId(undefined);
                    setScenarioActivatedAt(undefined);
                    setPendingIncidentFocusScenarioId(undefined);
                    setScenarioAutoplaying(false);
                    return;
                }
                const firstStep = resolveSteps(nextScenarioId, null).find((s) => !s.skip);
                navigateToStepRoute(firstStep);
                setActiveScenarioId(nextScenarioId);
                setActiveStepId(firstStep?.id);
                setScenarioActivatedAt(Date.now());
            },
            clearActiveScenario: () => {
                const tl = useTimelineStore.getState();
                tl.play();
                tl.setZoom("1W");
                setActiveScenarioId(undefined);
                setActiveStepId(undefined);
                setScenarioActivatedAt(undefined);
                setPendingIncidentFocusScenarioId(undefined);
                setScenarioAutoplaying(false);
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
            activeSteps,
            focus,
            scenarioActivatedAt,
            pendingIncidentFocusScenarioId,
            isScenarioAutoplaying,
            setFocus,
        ],
    );

    return <ScenarioContext.Provider value={value}>{children}</ScenarioContext.Provider>;
};
