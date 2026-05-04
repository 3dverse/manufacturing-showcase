import { useContext, useEffect } from "react";

import { FEATURED_SCENARIOS } from "@/content/scenarios";
import { ScenarioContext } from "@/contexts/ScenariosContext";
import { FactoryContext } from "@/contexts/FactoryContext";

export function ScenarioFocusResolver() {
    const { activeScenarioId, spanData, setGraphData } = useContext(ScenarioContext);
    const { nodeGraph } = useContext(FactoryContext);

    useEffect(() => {
        if (!activeScenarioId || !spanData || !nodeGraph) return;
        const scenario = FEATURED_SCENARIOS.find((s) => s.id === activeScenarioId);
        if (!scenario?.resolveGraph) return;
        setGraphData(activeScenarioId, scenario.resolveGraph(spanData, nodeGraph) ?? null);
        // setGraphData is stable via useCallback
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeScenarioId, spanData, nodeGraph]);

    return null;
}
