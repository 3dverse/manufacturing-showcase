//------------------------------------------------------------------------------
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Entity } from "@3dverse/livelink";
import { useEntities } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import { fetchElementsFromEntities } from "@/utils/entities";

//------------------------------------------------------------------------------
export type ElementType = "factory" | "area" | "line" | "cell" | "machine";
export type AreaCategory = "Production" | "Storage" | "Control";

//------------------------------------------------------------------------------
export type Element = { type: ElementType; id: string; count: string; entity: Entity; category?: AreaCategory };

//------------------------------------------------------------------------------
export interface Elements {
    factories: Element[];
    areas: Element[];
    lines: Element[];
    cells: Element[];
    machines: Element[];
}

//------------------------------------------------------------------------------
interface SelectedContextState {
    selectedElement: Element | null;
    setSelectedElementById: (id: string | null) => void;
    elements: Elements;
}

//------------------------------------------------------------------------------
const SelectedContext = createContext<SelectedContextState | null>(null);

//------------------------------------------------------------------------------
export function SelectedContextProvider({ children }: { children: ReactNode }) {
    const { entities } = useEntities({ mandatory_components: ["scene_ref"] });
    const [selectedElement, setSelectedElement] = useState<Element | null>(null);

    //--------------------------------------------------------------------------
    const elements = useMemo(() => fetchElementsFromEntities({ entities }), [entities]);

    //--------------------------------------------------------------------------
    const setSelectedElementById = useCallback(
        (id: string | null) => {
            if (!id) {
                setSelectedElement(null);
                return;
            }
            const element = elements.areas.find((area) => area.id === id);
            setSelectedElement(element ?? null);
        },
        [elements.areas],
    );

    //--------------------------------------------------------------------------
    const value = useMemo<SelectedContextState>(
        () => ({
            selectedElement,
            setSelectedElementById,
            elements,
        }),
        [selectedElement, setSelectedElementById, elements],
    );

    return <SelectedContext.Provider value={value}>{children}</SelectedContext.Provider>;
}

//------------------------------------------------------------------------------
export function useSelectedContext(): SelectedContextState {
    const ctx = useContext(SelectedContext);
    if (!ctx) {
        throw new Error("useSelectedContext must be used within a SelectedContextProvider");
    }
    return ctx;
}
