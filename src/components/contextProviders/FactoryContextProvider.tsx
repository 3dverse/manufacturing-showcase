import { useEffect, useMemo, useState } from "react";
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
    // State
    const [nodeGraph, setNodeGraph] = useState<FactoryNode | undefined>(undefined);
    const [nodeList, setNodeList] = useState<FactoryGraphNode[] | undefined>(undefined);

    //--------------------------------------------------------------------------
    // Effects
    useEffect(() => {
        // Merge entities and remove duplicates
        const entities = [...sceneRefEntities, ...tagEntities].filter(
            (e, index, self) => index === self.findIndex((t) => t.euid.value === e.euid.value),
        );
        buildFactoryGraph({ entities })
            .then(({ graph, list }) => {
                setNodeGraph(graph);
                setNodeList(list);
            })
            .catch(() => {
                console.warn("error loading entities");
            });
    }, [sceneRefEntities, tagEntities]);

    //--------------------------------------------------------------------------
    // Memos
    const value = useMemo(() => {
        if (!nodeGraph || !nodeList) return;
        return { factory, nodeGraph, nodeList };
    }, [factory, nodeGraph, nodeList]);

    //--------------------------------------------------------------------------
    // Render
    if (!value) return <></>;
    return <FactoryContext.Provider value={value}>{children}</FactoryContext.Provider>;
};
