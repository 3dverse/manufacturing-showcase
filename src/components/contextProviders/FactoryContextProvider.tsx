import { useEffect, useMemo, useState } from "react";
import { useEntities } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import { FactoryContext } from "@/contexts/FactoryContext";

//------------------------------------------------------------------------------
import { buildNavGraph } from "@/core/NavGraph";
import { useTimelineStore } from "@/store/useTimelineStore";

//------------------------------------------------------------------------------
import type { ReactNode } from "react";
import type { Factory } from "@/content/type";
import type { NavGraphNode, FactoryNode } from "@/content/type";

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
    const [nodeList, setNodeList] = useState<NavGraphNode[] | undefined>(undefined);

    //--------------------------------------------------------------------------
    // Store
    const loadSpan = useTimelineStore((s) => s.loadSpan);

    //--------------------------------------------------------------------------
    // Effects
    useEffect(() => {
        const entities = [...sceneRefEntities, ...tagEntities.filter((e) => !e.scene_ref)];
        buildNavGraph({ entities })
            .then(({ graph, list }) => {
                setNodeGraph(graph);
                setNodeList(list);
            })
            .catch(() => {
                console.warn("error loading entities");
            });
    }, [sceneRefEntities, tagEntities]);

    useEffect(() => {
        if (!nodeGraph) return;
        const productionArea = nodeGraph.areas.find((a) => a.name.toLowerCase() === "production");
        if (productionArea) loadSpan(productionArea, factory.scene_id);
    }, [nodeGraph, factory.scene_id, loadSpan]);

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
