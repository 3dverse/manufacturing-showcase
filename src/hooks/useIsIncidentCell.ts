import { useContext, useMemo } from "react";

//------------------------------------------------------------------------------
import { UseCaseContext } from "@/contexts/UseCaseContext";
import { isLine } from "@/core/SceneGraph";
import type { CellNode } from "@/content/type";
import type { UseCaseCellMatcher } from "@/content/useCases";

//------------------------------------------------------------------------------
const normalizedIncludes = (value: string, terms?: string[]) => {
    if (!terms?.length) return true;
    return terms.some((term) => value.toLowerCase().includes(term.toLowerCase()));
};

const matchesCellMatcher = (cell: CellNode, matcher: UseCaseCellMatcher) => {
    const parentLineName = isLine(cell.parent) ? cell.parent.name : "";
    const machineNames = cell.machines.map((m) => m.name);

    return (
        normalizedIncludes(parentLineName, matcher.lineNameIncludes) &&
        normalizedIncludes(cell.name, matcher.cellNameIncludes) &&
        (!matcher.machineNameIncludes?.length ||
            machineNames.some((machineName) => normalizedIncludes(machineName, matcher.machineNameIncludes)))
    );
};

//------------------------------------------------------------------------------
export const useIsIncidentCell = (cell: CellNode): boolean => {
    const { useCases, activeUseCaseId } = useContext(UseCaseContext);

    return useMemo(() => {
        if (!activeUseCaseId) return false;
        const useCase = useCases[activeUseCaseId];
        if (!useCase) return false;
        return useCase?.simulatedDowntimeCellMatchers?.some((matcher) => matchesCellMatcher(cell, matcher)) ?? false;
    }, [activeUseCaseId, useCases, cell]);
};
