import { useCallback, useEffect, useMemo, useState } from "react";

//------------------------------------------------------------------------------
import { useEntities } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import { FactoryContext } from "@/contexts/FactoryContext";

//------------------------------------------------------------------------------
import { buildSceneGraph } from "@/core/SceneGraph";
import { useTimelineStore } from "@/store/useTimelineStore";

//------------------------------------------------------------------------------
import type { ReactNode } from "react";
import type { Factory } from "@/content/type";
import type { SceneGraphNode, FactoryNode } from "@/content/type";
import type { Entity } from "@3dverse/livelink";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const FactoryContextProvider = ({ factory, children }: { factory: Factory; children: ReactNode }) => {
    //--------------------------------------------------------------------------
    // State
    const [nodeGraph, setNodeGraph] = useState<FactoryNode | undefined>(undefined);
    const [nodeList, setNodeList] = useState<SceneGraphNode[] | undefined>(undefined);

    //--------------------------------------------------------------------------
    // Hooks
    const { entities: sceneRefEntities } = useEntities({ mandatory_components: ["scene_ref"] });
    const { entities: tagEntities } = useEntities({ mandatory_components: ["tags"] });

    //--------------------------------------------------------------------------
    // Store
    const loadSpan = useTimelineStore((s) => s.loadSpan);

    //--------------------------------------------------------------------------
    // Handlers
    const loadEntities = useCallback((entities: Entity[]) => {
        buildSceneGraph({ entities })
            .then(({ graph, list }) => {
                setNodeGraph(graph);
                setNodeList(list);
            })
            .catch(() => {
                console.warn("error loading entities");
            });
    }, []);

    //--------------------------------------------------------------------------
    // Effects
    useEffect(() => {
        if (!nodeGraph) return;
        const productionArea = nodeGraph.areas.find((a) => a.name.toLowerCase() === "production");
        if (productionArea) loadSpan(factory.scene_id, productionArea);
    }, [nodeGraph, factory.scene_id, loadSpan]);

    //--------------------------------------------------------------------------
    useEffect(() => {
        if (sceneRefEntities.length === 0 || tagEntities.length === 0) return;
        loadEntities([...sceneRefEntities, ...tagEntities.filter((e) => !e.scene_ref)]);
    }, [loadEntities, sceneRefEntities, tagEntities]);

    //--------------------------------------------------------------------------
    // Memos
    const value = useMemo(() => {
        if (!nodeGraph || !nodeList) return;
        return { factory, nodeGraph, nodeList };
    }, [factory, nodeGraph, nodeList]);

    //--------------------------------------------------------------------------
    // Render
    if (!value) return;
    return <FactoryContext.Provider value={value}>{children}</FactoryContext.Provider>;
};
