//------------------------------------------------------------------------------
import { useContext, useCallback, useMemo, type MouseEvent } from "react";

//------------------------------------------------------------------------------
import { LivelinkExfilContext } from "@/contexts/LivelinkExfilContext";
import { SelectionContext } from "@/contexts/SelectionContext";
import { useDragGuard } from "@/hooks/useDragGuard";

//------------------------------------------------------------------------------
import { getDefaultOrientationForNodeType, moveCamera } from "@/utils/camera-v2";

//------------------------------------------------------------------------------
import type { FactoryGraphNode } from "@/content/type";
import { HoverContext } from "@/contexts/HoverContext";
import { NodeTypes } from "@/content/enums";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const useNavNode = (node: FactoryGraphNode, source: "nav" | "dom3d") => {
    //--------------------------------------------------------------------------
    // Contexts
    const { selectedNode, setSelectedNode } = useContext(SelectionContext);
    const { hoveredNode, setHoveredNode } = useContext(HoverContext);
    const { cameraControllerRef, viewportRef, cameraEntity } = useContext(LivelinkExfilContext);
    const { pointerDownHandler, isDrag } = useDragGuard();

    //--------------------------------------------------------------------------
    // Memos
    const parentNodes = useMemo(() => getParentNodes(node), [node]);

    //--------------------------------------------------------------------------
    const childNodes = useMemo(() => getChildNodes(node), [node]);

    //--------------------------------------------------------------------------
    const parentNodeHashes = useMemo(() => parentNodes.map((n) => n.hash), [parentNodes]);

    //--------------------------------------------------------------------------
    const childNodeHashes = useMemo(() => childNodes.map((n) => n.hash), [childNodes]);

    //--------------------------------------------------------------------------
    const isSelected = useMemo(() => selectedNode?.hash === node?.hash, [selectedNode, node]);

    //--------------------------------------------------------------------------
    const isChildSelected = useMemo(
        () => selectedNode && childNodeHashes.includes(selectedNode.hash),
        [selectedNode, childNodeHashes],
    );

    //--------------------------------------------------------------------------
    const isParentSelected = useMemo(
        () => selectedNode && parentNodeHashes.includes(selectedNode.hash),
        [selectedNode, parentNodeHashes],
    );

    //--------------------------------------------------------------------------
    const isHovered = useMemo(() => hoveredNode?.hash === node?.hash, [hoveredNode, node]);

    //--------------------------------------------------------------------------
    const isChildHovered = useMemo(
        () => hoveredNode && childNodeHashes.includes(hoveredNode.hash),
        [hoveredNode, childNodeHashes],
    );

    //--------------------------------------------------------------------------
    const isParentHovered = useMemo(
        () => hoveredNode && parentNodeHashes.includes(hoveredNode.hash),
        [hoveredNode, parentNodeHashes],
    );

    //--------------------------------------------------------------------------
    const isActive = useMemo(() => isSelected || isChildSelected, [isSelected, isChildSelected]);

    //--------------------------------------------------------------------------
    const isParentActive = useMemo(() => {
        if (!selectedNode) return false;
        const nodeParents = getParentNodes(node).map((n) => n.hash);
        const selectedParents = getParentNodes(selectedNode).map((n) => n.hash);
        return nodeParents.some((n) => selectedParents.includes(n));
    }, [node, selectedNode]);

    //--------------------------------------------------------------------------
    const clickHandler = useCallback(
        (e: MouseEvent) => {
            e.stopPropagation();
            if (isDrag(e)) return;
            if (node.hash !== selectedNode?.hash) {
                setSelectedNode(node);
            } else {
                const controller = cameraControllerRef?.current;
                const viewport = viewportRef?.current;
                if (controller && viewport && cameraEntity) {
                    moveCamera(
                        node.entity,
                        controller,
                        viewport,
                        cameraEntity,
                        getDefaultOrientationForNodeType(node.type),
                    );
                }
            }
        },
        [setSelectedNode, node, cameraControllerRef, viewportRef, cameraEntity, selectedNode, isDrag],
    );

    //--------------------------------------------------------------------------
    const mouseEnterHandler = useCallback(() => {
        setHoveredNode(node, source);
    }, [setHoveredNode, node, source]);

    //--------------------------------------------------------------------------
    const mouseLeaveHandler = useCallback(() => {
        setHoveredNode(undefined, source);
    }, [setHoveredNode, source]);

    //--------------------------------------------------------------------------
    return {
        isActive,
        isParentActive,
        isSelected,
        isParentSelected,
        isChildSelected,
        isHovered,
        isParentHovered,
        isChildHovered,
        pointerDownHandler,
        clickHandler,
        mouseEnterHandler,
        mouseLeaveHandler,
        setSelectedNode,
    };
};

//------------------------------------------------------------------------------
export const getParentNodes = (node: FactoryGraphNode) => {
    function addParent(parents: FactoryGraphNode[], node: FactoryGraphNode) {
        if (node.type === NodeTypes.factory) return parents;
        return addParent([...parents, node], node.parent);
    }
    return addParent([], node);
};

//------------------------------------------------------------------------------
export const getChildNodes = (node: FactoryGraphNode) => {
    function flatten(node: FactoryGraphNode): FactoryGraphNode[] {
        switch (node.type) {
            case NodeTypes.factory:
                return [node, ...node.areas.flatMap(flatten)];
            case NodeTypes.area:
                return [node, ...node.lines.flatMap(flatten), ...node.cells.flatMap(flatten)];
            case NodeTypes.line:
                return [node, ...node.cells.flatMap(flatten)];
            case NodeTypes.cell:
                return [node, ...node.machines.flatMap(flatten)];
            case NodeTypes.machine:
                return [node];
        }
    }

    return flatten(node);
};
