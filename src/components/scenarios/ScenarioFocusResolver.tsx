import { useContext, useEffect } from "react";

import { ScenarioContext } from "@/contexts/ScenariosContext";
import { FactoryContext } from "@/contexts/FactoryContext";
import { useTimelineStore } from "@/store/useTimelineStore";

export function ScenarioFocusResolver() {
    const { activeScenarioId, scenarios, setFocus } = useContext(ScenarioContext);
    const { nodeGraph } = useContext(FactoryContext);
    const span = useTimelineStore((s) => s.span);

    useEffect(() => {
        if (!activeScenarioId || !span || !nodeGraph) return;
        const scenario = scenarios[activeScenarioId];
        if (!scenario?.resolve) return;
        const focus = scenario.resolve(span, nodeGraph);
        setFocus(activeScenarioId, focus);
        if (focus) scenario.onFocusResolved?.(focus);
        // scenarios is a module-level constant; setFocus is stable via useCallback
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeScenarioId, span, nodeGraph]);

    return null;
}
