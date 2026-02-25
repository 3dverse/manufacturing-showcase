import { useMemo } from "react";
import { useEntities } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import { FactoryContext } from "@/contexts/FactoryContext";
import { useFactoryStore } from "@/store/useFactoryStore";

//------------------------------------------------------------------------------
import { buildFactoryGraph } from "@/utils/FactoryGraph";

//------------------------------------------------------------------------------
import type { ReactNode } from "react";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const FactoryContextProvider = ({ children }: { children: ReactNode }) => {
    //--------------------------------------------------------------------------
    // Context
    const { currentFactory } = useFactoryStore();

    //--------------------------------------------------------------------------
    // Hooks
    const { entities } = useEntities({ mandatory_components: ["scene_ref"] });

    //--------------------------------------------------------------------------
    // Memos
    const value = useMemo(() => {
        const { graph, list } = buildFactoryGraph({
            entities,
            area_categories_sort: currentFactory?.area_categories_sort || [],
        });
        return {
            nodeGraph: graph,
            nodeList: list,
        };
    }, [entities, currentFactory?.area_categories_sort]);

    //--------------------------------------------------------------------------
    // Render
    return <FactoryContext.Provider value={value}>{children}</FactoryContext.Provider>;
};
