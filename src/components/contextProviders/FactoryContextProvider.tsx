import { useMemo } from "react";
import { useEntities } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import { FactoryContext } from "@/contexts/FactoryContext";

//------------------------------------------------------------------------------
import { buildFactoryGraph } from "@/utils/FactoryGraph";

//------------------------------------------------------------------------------
import type { ReactNode } from "react";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const FactoryContextProvider = ({ children }: { children: ReactNode }) => {
    //--------------------------------------------------------------------------
    // Hooks
    const { entities } = useEntities({ mandatory_components: ["scene_ref"] });

    //--------------------------------------------------------------------------
    // Memos
    const value = useMemo(() => {
        const { graph, list } = buildFactoryGraph({
            entities,
        });
        return {
            nodeGraph: graph,
            nodeList: list,
        };
    }, [entities]);

    //--------------------------------------------------------------------------
    // Render
    return <FactoryContext.Provider value={value}>{children}</FactoryContext.Provider>;
};
