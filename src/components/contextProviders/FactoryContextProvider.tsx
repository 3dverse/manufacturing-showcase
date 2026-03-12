import { useEffect, useState } from "react";
import { useEntities } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import { FactoryContext } from "@/contexts/FactoryContext";

//------------------------------------------------------------------------------
import { buildFactoryGraph } from "@/core/FactoryGraph";

//------------------------------------------------------------------------------
import type { ReactNode } from "react";
import type { Factory } from "@/content/factory";
import type { FactoryGraphNode, FactoryNode } from "@/content/type";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const FactoryContextProvider = ({ factory, children }: { factory: Factory; children: ReactNode }) => {
    //--------------------------------------------------------------------------
    // Hooks
    const { entities: sceneRefEntities } = useEntities({ mandatory_components: ["scene_ref"] });
    const { entities: tagEntities } = useEntities({ mandatory_components: ["tags"] });

    //--------------------------------------------------------------------------
    const [graph, setGraph] = useState<FactoryNode | undefined>(undefined);
    const [list, setList] = useState<FactoryGraphNode[]>([]);

    //--------------------------------------------------------------------------
    useEffect(() => {
        // Merge entities and remove duplicates
        const entities = [...sceneRefEntities, ...tagEntities].filter(
            (e, index, self) => index === self.findIndex((t) => t.euid.value === e.euid.value),
        );
        buildFactoryGraph({ entities }).then(({ graph: g, list: l }) => {
            setGraph(g);
            setList(l);
        });
    }, [sceneRefEntities, tagEntities]);

    const value = {
        factory,
        nodeGraph: graph,
        nodeList: list,
    };

    //--------------------------------------------------------------------------
    // Render
    return <FactoryContext.Provider value={value}>{children}</FactoryContext.Provider>;
};
