//------------------------------------------------------------------------------
import { useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

//------------------------------------------------------------------------------
import { SelectionContext } from "@/contexts/SelectionContext";
import { CameraContext } from "@/contexts/CameraContext";
import { FactoryContext } from "@/contexts/FactoryContext";

//------------------------------------------------------------------------------
import { Router } from "@/core/Router";
import { getDefaultOrientationForNodeType, moveCamera } from "@/utils/camera-v2";

//------------------------------------------------------------------------------
import type { Entity } from "@3dverse/livelink";
import type { FactoryGraphNode } from "@/content/type";
import type { RouteChangeEvent } from "@/core/Router";
import { NodeTypes } from "@/content/enums";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export function SelectionContextProvider({ children }: { children: ReactNode }) {
    //--------------------------------------------------------------------------
    // Context
    const { factory, nodeGraph, nodeList } = useContext(FactoryContext);
    const { viewportRef, cameraControllerRef, cameraEntity } = useContext(CameraContext);

    //--------------------------------------------------------------------------
    // State
    const [selectedNode, _setSelectedNode] = useState<FactoryGraphNode>();

    //--------------------------------------------------------------------------
    // Refs
    const viewerInitialized = useRef<boolean>(false);
    const initialNodeSlug = useRef<string>(undefined);

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
            if (factory.slug === Router.activeFactorySlug) {
                const factorySlug = factory.slug;
                const nodeSlug = node && node.type !== NodeTypes.factory ? Router.uuidToSlug(node?.euid) : undefined;
                Router.push({ factorySlug, nodeSlug });
            }
            _setSelectedNode(node);
            if (node) cameraHandler(node);
        },
        [factory, cameraHandler],
    );

    //--------------------------------------------------------------------------
    const setSelectedNodeByEntity = useCallback((entity: Entity | undefined) => {
        console.warn("//TODO: implement! selected entity", entity);
    }, []);

    //--------------------------------------------------------------------------
    const routeChangeHandler = useCallback(
        (event: RouteChangeEvent) => {
            switch (event.source) {
                case "init":
                    if (event.route.factorySlug === factory.slug) {
                        initialNodeSlug.current = event.route.nodeSlug;
                    }
                    break;
                case "pop":
                    if (event.route?.nodeSlug) {
                        const nodeSlug = event.route.nodeSlug;
                        const node = nodeList.find((n) => n.euid.startsWith(nodeSlug)) || nodeGraph;
                        _setSelectedNode(node);
                        if (node) cameraHandler(node);
                    } else if (nodeGraph) {
                        _setSelectedNode(nodeGraph);
                        cameraHandler(nodeGraph);
                    }
                    break;
            }
        },
        [factory.slug, nodeGraph, nodeList, cameraHandler],
    );

    //--------------------------------------------------------------------------
    useEffect(() => {
        Router.onChange(routeChangeHandler);
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

                let node: FactoryGraphNode = nodeGraph;
                if (initialNodeSlug.current) {
                    const nodeSlug = initialNodeSlug.current;
                    node = nodeList.find((n) => n.euid.startsWith(nodeSlug)) || nodeGraph;
                }
                _setSelectedNode(node);
                cameraHandler(node);
            } else {
                setTimeout(check, 200);
            }
        }
        check();
    }, [viewerInitialized, nodeGraph, nodeList, cameraHandler, cameraControllerRef, viewportRef, cameraEntity]);

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
