import {
    createContext,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type Dispatch,
    type ReactNode,
    type SetStateAction,
} from "react";

//------------------------------------------------------------------------------
import { useNavigationStore } from "@/store/useNavigationStore";
import { useTimelineStore } from "@/store/useTimelineStore";
import { Router } from "@/core/Router";

//------------------------------------------------------------------------------
import { FEATURED_SCENARIOS } from "@/content/scenarios";

//------------------------------------------------------------------------------
import type { ScenarioStep } from "@/content/type";
import type { ScenarioGraphData, ScenarioSpanData } from "@/content/scenarios/types";

//------------------------------------------------------------------------------
// Types
//------------------------------------------------------------------------------

export type ScenarioContextType = {
    scenarios: typeof FEATURED_SCENARIOS;
    activeScenarioId: string | undefined;
    activeStepId: string | undefined;
    activeStep: ScenarioStep | undefined;
    activeSteps: ScenarioStep[];
    spanData: ScenarioSpanData | null;
    graphData: ScenarioGraphData | null;
    scenarioActivatedAt: number | undefined;
    shroudTargetPosition: { x: number; y: number } | undefined;
    messageTargetPosition: { x: number; y: number } | undefined;
    isScenarioAutoplaying: boolean;
    setScenarioAutoplaying: Dispatch<SetStateAction<boolean>>;
    setGraphData: (scenarioId: string, data: ScenarioGraphData | null) => void;
    activateScenario: (scenarioId: string) => void;
    prevStep: () => void;
    nextStep: () => void;
    clearActiveScenario: () => void;
};

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const hasGuidanceQuery = () => new URLSearchParams(window.location.search).has("guidance");

const resolveSteps = (
    scenarioId?: string,
    spanData: ScenarioSpanData | null = null,
    graphData?: ScenarioGraphData,
): ScenarioStep[] => {
    if (!scenarioId) return [];
    const scenario = FEATURED_SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return [];
    return typeof scenario.steps === "function" ? scenario.steps(spanData, graphData) : scenario.steps;
};

const getFirstScenarioStepId = (scenarioId?: string) => resolveSteps(scenarioId).find((s) => !s.skip)?.id;

const getNextScenarioId = (scenarioId?: string) => {
    if (!scenarioId) return undefined;
    const idx = FEATURED_SCENARIOS.findIndex((s) => s.id === scenarioId);
    return FEATURED_SCENARIOS[idx + 1]?.id;
};

const pushRoute = (route: string) => {
    useNavigationStore.getState().navigate(route);
    const [, factorySlug, nodeSlug, itemSlug] = route.split("/");
    if (factorySlug) Router.replace({ factorySlug, nodeSlug, itemSlug });
};

const navigateToStepRoute = (step: ScenarioStep) => {
    if (step.route && window.location.pathname !== step.route) pushRoute(step.route);
    const override = step.beforeRoute?.();
    if (typeof override === "string" && override && window.location.pathname !== override) pushRoute(override);
};

//------------------------------------------------------------------------------
// Context
//------------------------------------------------------------------------------

// eslint-disable-next-line react-refresh/only-export-components
export const ScenarioContext = createContext(
    new Proxy({} as ScenarioContextType, {
        get() {
            throw new Error("ScenarioContext must be used within a ScenarioContextProvider");
        },
    }),
);

//------------------------------------------------------------------------------
const queryCenter = (selector: string) => {
    const el = document.querySelector(selector);
    if (!el) return undefined;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

//------------------------------------------------------------------------------
// Provider
//------------------------------------------------------------------------------

export const ScenarioContextProvider = ({ children }: { children: ReactNode }) => {
    //--------------------------------------------------------------------------
    // Refs
    const cameraHasSettled = useRef<boolean>(true);
    const focusResolvedAtRef = useRef<number | null>(null);
    const activeStepIdRef = useRef<string | null>(null);

    //--------------------------------------------------------------------------
    // State
    const [shroudTargetPosition, setShroudTargetPosition] = useState<{ x: number; y: number } | undefined>();
    const [messageTargetPosition, setMessageTargetPosition] = useState<{ x: number; y: number } | undefined>();

    const [graphDataMap, setGraphDataMap] = useState<Record<string, ScenarioGraphData | null>>({});

    const [activeScenarioId, setActiveScenarioId] = useState<string | undefined>(() =>
        hasGuidanceQuery() ? FEATURED_SCENARIOS.find((s) => !s.disabled)?.id : undefined,
    );
    const [activeStepId, setActiveStepId] = useState<string | undefined>(() =>
        hasGuidanceQuery() ? getFirstScenarioStepId(FEATURED_SCENARIOS.find((s) => !s.disabled)?.id) : undefined,
    );
    const [scenarioActivatedAt, setScenarioActivatedAt] = useState<number | undefined>(() =>
        hasGuidanceQuery() ? Date.now() : undefined,
    );
    const [isScenarioAutoplaying, setScenarioAutoplaying] = useState(false);

    //--------------------------------------------------------------------------
    // Hooks
    const span = useTimelineStore((s) => s.span);

    //--------------------------------------------------------------------------
    // Memos
    const graphData = useMemo(
        () => (activeScenarioId ? (graphDataMap[activeScenarioId] ?? null) : null),
        [graphDataMap, activeScenarioId],
    );

    //--------------------------------------------------------------------------
    const spanData = useMemo(() => {
        if (!activeScenarioId || !span) return null;
        return FEATURED_SCENARIOS.find((s) => s.id === activeScenarioId)?.resolveSpan?.(span) ?? null;
    }, [activeScenarioId, span]);

    //--------------------------------------------------------------------------
    const activeSteps = useMemo(
        () => resolveSteps(activeScenarioId, spanData, graphData ?? undefined),
        [activeScenarioId, spanData, graphData],
    );

    //--------------------------------------------------------------------------
    const activeStep = useMemo(() => activeSteps.find((s) => s.id === activeStepId), [activeSteps, activeStepId]);

    //--------------------------------------------------------------------------
    // Handlers
    const setGraphData = useCallback(
        (scenarioId: string, data: ScenarioGraphData | null) =>
            setGraphDataMap((prev) => ({ ...prev, [scenarioId]: data })),
        [],
    );

    //--------------------------------------------------------------------------
    const updateTargetPositions = useCallback(() => {
        const shroudPosition =
            !activeStep?.shroud?.waitForCamera || cameraHasSettled.current
                ? activeStep?.shroud?.selector
                    ? queryCenter(activeStep.shroud.selector)
                    : undefined
                : undefined;

        const messagePosition =
            !activeStep?.message?.waitForCamera || cameraHasSettled.current
                ? activeStep?.message?.selector
                    ? (queryCenter(activeStep.message.selector) ?? shroudPosition)
                    : shroudPosition
                : undefined;

        setShroudTargetPosition(shroudPosition);
        setMessageTargetPosition(messagePosition);
    }, [activeStep]);

    //--------------------------------------------------------------------------
    // Effects
    useLayoutEffect(() => {
        updateTargetPositions();
        const hasSelector = !!(activeStep?.shroud?.selector || activeStep?.message?.selector);
        if (!hasSelector) return;
        const id = setTimeout(updateTargetPositions, 1000);
        return () => clearTimeout(id);
    }, [updateTargetPositions, activeStep?.shroud?.selector, activeStep?.message?.selector]);

    //--------------------------------------------------------------------------
    useEffect(() => {
        if (!activeScenarioId || !spanData) return;
        if (focusResolvedAtRef.current === scenarioActivatedAt) return;
        focusResolvedAtRef.current = scenarioActivatedAt ?? null;
        FEATURED_SCENARIOS.find((s) => s.id === activeScenarioId)?.onFocusResolved?.(spanData, graphData ?? undefined);
    }, [activeScenarioId, spanData, graphData, scenarioActivatedAt]);

    //--------------------------------------------------------------------------
    useEffect(() => {
        const cameraMovingHandler = () => {
            cameraHasSettled.current = false;
        };
        const cameraSettledHandler = () => {
            cameraHasSettled.current = true;
            updateTargetPositions();
        };
        const repositionHanlder = () => {
            updateTargetPositions();
        };
        window.addEventListener("cameraSettled", cameraSettledHandler);
        window.addEventListener("cameraMoving", cameraMovingHandler);
        window.addEventListener("resize", repositionHanlder);
        window.addEventListener("scroll", repositionHanlder, true);
        return () => {
            window.removeEventListener("cameraSettled", cameraSettledHandler);
            window.removeEventListener("cameraMoving", cameraMovingHandler);
            window.removeEventListener("resize", repositionHanlder);
            window.removeEventListener("scroll", repositionHanlder, true);
        };
    }, [updateTargetPositions]);

    //--------------------------------------------------------------------------
    useEffect(() => {
        if (!activeStep || activeStep.id === activeStepIdRef.current) return;
        activeStepIdRef.current = activeStep.id;
        navigateToStepRoute(activeStep);
        activeStep.afterRoute?.();
        updateTargetPositions();
    }, [activeStep, updateTargetPositions]);

    //--------------------------------------------------------------------------
    // Actions
    const goToScenario = useCallback((scenarioId: string) => {
        setActiveScenarioId(scenarioId);
        setActiveStepId(getFirstScenarioStepId(scenarioId));
        setScenarioActivatedAt(Date.now());
    }, []);

    //--------------------------------------------------------------------------
    const activateScenario = useCallback(
        (scenarioId: string) => {
            setScenarioAutoplaying(false);
            useTimelineStore.getState().pause();
            goToScenario(scenarioId);
        },
        [goToScenario],
    );

    //--------------------------------------------------------------------------
    const clearActiveScenario = useCallback(() => {
        const tl = useTimelineStore.getState();
        tl.play();
        tl.setZoom("1W");
        setScenarioAutoplaying(false);
        setActiveScenarioId(undefined);
        setActiveStepId(undefined);
        setScenarioActivatedAt(undefined);
    }, []);

    //--------------------------------------------------------------------------
    const prevStep = useCallback(() => {
        const currentIndex = activeSteps.findIndex((s) => s.id === activeStepId);
        const prev = [...activeSteps.slice(0, currentIndex)].reverse().find((s) => !s.skip);
        if (prev) setActiveStepId(prev.id);
    }, [activeSteps, activeStepId]);

    //--------------------------------------------------------------------------
    const nextStep = useCallback(() => {
        const currentIndex = activeSteps.findIndex((s) => s.id === activeStepId);
        const next = activeSteps.slice(currentIndex + 1).find((s) => !s.skip);
        if (next) {
            setActiveStepId(next.id);
            return;
        }
        const nextScenarioId = getNextScenarioId(activeScenarioId);
        if (nextScenarioId) goToScenario(nextScenarioId);
        else clearActiveScenario();
    }, [activeSteps, activeStepId, activeScenarioId, goToScenario, clearActiveScenario]);

    //--------------------------------------------------------------------------
    const value = useMemo(
        () => ({
            scenarios: FEATURED_SCENARIOS,
            activeScenarioId,
            activeStepId,
            activeStep,
            activeSteps,
            spanData,
            graphData,
            scenarioActivatedAt,
            shroudTargetPosition,
            messageTargetPosition,
            isScenarioAutoplaying,
            setScenarioAutoplaying,
            setGraphData,
            activateScenario,
            prevStep,
            nextStep,
            clearActiveScenario,
        }),
        [
            activeScenarioId,
            activeStepId,
            activeStep,
            activeSteps,
            spanData,
            graphData,
            scenarioActivatedAt,
            shroudTargetPosition,
            messageTargetPosition,
            isScenarioAutoplaying,
            setGraphData,
            activateScenario,
            prevStep,
            nextStep,
            clearActiveScenario,
        ],
    );

    return <ScenarioContext.Provider value={value}>{children}</ScenarioContext.Provider>;
};
