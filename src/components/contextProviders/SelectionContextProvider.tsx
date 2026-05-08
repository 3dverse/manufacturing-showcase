//------------------------------------------------------------------------------
import { useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

//------------------------------------------------------------------------------
import { SelectionContext } from "@/contexts/SelectionContext";
import { LivelinkExfilContext } from "@/contexts/LivelinkExfilContext";
import { FactoryContext } from "@/contexts/FactoryContext";

//------------------------------------------------------------------------------
import { Router } from "@/core/Router";
import { isFactory } from "@/core/SceneGraph";
import { getDefaultOrientationForNodeType, moveCamera } from "@/utils/camera";

//------------------------------------------------------------------------------
import type { Entity } from "@3dverse/livelink";
import type { SceneGraphNode } from "@/content/type";
import type { RouteChangeEvent } from "@/core/Router";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export function SelectionContextProvider({ children }: { children: ReactNode }) {
    //--------------------------------------------------------------------------
    // Context
    const { factory, nodeGraph, nodeList } = useContext(FactoryContext);
    const { viewportRef, cameraControllerRef, cameraEntity } = useContext(LivelinkExfilContext);

    //--------------------------------------------------------------------------
    // State
    const [selectedNode, _setSelectedNode] = useState<SceneGraphNode>();

    //--------------------------------------------------------------------------
    // Refs
    const viewerInitialized = useRef<boolean>(false);

    //--------------------------------------------------------------------------
    // Handlers
    const cameraHandler = useCallback(
        (node: SceneGraphNode) => {
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
        (node: SceneGraphNode | undefined) => {
            const factorySlug = factory.slug;
            const nodeSlug = node && !isFactory(node) ? Router.uuidToSlug(node?.hash) : undefined;

            Router.push({ factorySlug, nodeSlug });
            _setSelectedNode(node);
            if (node) cameraHandler(node);
        },
        [factory.slug, cameraHandler],
    );

    //--------------------------------------------------------------------------
    const setSelectedNodeByEntity = useCallback((entity: Entity | undefined) => {
        console.warn("//TODO: implement! selected entity", entity);
    }, []);

    //--------------------------------------------------------------------------
    const routeChangeHandler = useCallback(
        (event: RouteChangeEvent) => {
            if (event.source !== "replace" && event.source !== "pop") return;

            if (event.route?.nodeSlug) {
                const nodeSlug = event.route.nodeSlug;
                const node = nodeList.find((n) => n.hash.startsWith(nodeSlug)) || nodeGraph;
                _setSelectedNode(node);
                if (node) cameraHandler(node);
            } else if (nodeGraph) {
                _setSelectedNode(nodeGraph);
                cameraHandler(nodeGraph);
            }
        },
        [nodeGraph, nodeList, cameraHandler],
    );

    //--------------------------------------------------------------------------
    useEffect(() => {
        return Router.onChange(routeChangeHandler);
    }, [routeChangeHandler]);

    //--------------------------------------------------------------------------
    useEffect(() => {
        // Initialize the view
        function check() {
            if (
                !viewerInitialized.current &&
                nodeGraph &&
                cameraControllerRef.current &&
                viewportRef.current &&
                cameraEntity
            ) {
                viewerInitialized.current = true;
                const route = Router.currentRoute();
                let node: SceneGraphNode = nodeGraph;
                if (route.factorySlug === factory.slug && route.nodeSlug) {
                    node = nodeList.find((n) => n.hash.startsWith(route.nodeSlug!)) || nodeGraph;
                }
                _setSelectedNode(node);
                cameraHandler(node);
            } else {
                setTimeout(check, 200);
            }
        }
        check();
    }, [
        viewerInitialized,
        nodeGraph,
        nodeList,
        cameraHandler,
        cameraControllerRef,
        viewportRef,
        cameraEntity,
        factory.slug,
    ]);

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
