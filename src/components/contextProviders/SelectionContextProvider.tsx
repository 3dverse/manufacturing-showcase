//------------------------------------------------------------------------------
import { useCallback, useContext, useMemo, useState, type ReactNode } from "react";

//------------------------------------------------------------------------------
import { SelectionContext } from "@/contexts/SelectionContext";
import type { FactoryGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
import type { Entity } from "@3dverse/livelink";
export type ElementType = "factory" | "area" | "line" | "cell" | "machine";
export type AreaCategory = "Reception" | "Production" | "Storage" | "Control";
export type Element = { type: ElementType; id: string; count: string; entity: Entity; category?: AreaCategory };

//------------------------------------------------------------------------------
import { getDefaultOrientationForNodeType, moveCamera } from "@/utils/camera-v2";
import { CameraContext } from "@/contexts/CameraContext";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export function SelectionContextProvider({ children }: { children: ReactNode }) {
    //--------------------------------------------------------------------------
    // Context
    const { viewportRef, cameraControllerRef, cameraEntity } = useContext(CameraContext);

    //--------------------------------------------------------------------------
    // State
    const [selectedNode, _setSelectedNode] = useState<FactoryGraphNode>();

    //--------------------------------------------------------------------------
    // Handlers
    const cameraHandler = useCallback(
        (node: FactoryGraphNode) => {
            if (node && cameraControllerRef.current && viewportRef.current && cameraEntity) {
                moveCamera(
                    node.entity,
                    cameraControllerRef.current,
                    viewportRef.current,
                    cameraEntity,
                    getDefaultOrientationForNodeType(node.type),
                );
            }
        },
        [cameraControllerRef, viewportRef, cameraEntity],
    );

    //--------------------------------------------------------------------------
    const setSelectedNode = useCallback(
        (node: FactoryGraphNode | undefined) => {
            _setSelectedNode(node);
            if (node) cameraHandler(node);
        },
        [cameraHandler],
    );

    //--------------------------------------------------------------------------
    const setSelectedNodeByEntity = useCallback((entity: Entity | undefined) => {
        console.warn("//TODO: implement! selected entity", entity);
    }, []);

    //--------------------------------------------------------------------------
    const value = useMemo(
        () => ({
            selectedNode,
            setSelectedNode,
            setSelectedNodeByEntity,
        }),
        [selectedNode, setSelectedNode, setSelectedNodeByEntity],
    );

    return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}
