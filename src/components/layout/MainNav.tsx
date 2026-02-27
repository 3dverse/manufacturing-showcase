//------------------------------------------------------------------------------
import React, { useContext, useCallback, useMemo, type MouseEvent } from "react";
import { faHome } from "@fortawesome/sharp-light-svg-icons";

//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { Icon } from "@/components/common/Icon";
import Button from "@/components/common/Button";

//------------------------------------------------------------------------------
import { CameraContext } from "@/contexts/CameraContext";
import { FactoryContext } from "@/contexts/FactoryContext";
import { SelectionContext } from "@/contexts/SelectionContext";

//------------------------------------------------------------------------------
import { getDefaultOrientationForNodeType, moveCamera } from "@/utils/camera-v2";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { AreaNode, CellNode, FactoryGraphNode } from "@/content/type";
import { NodeTypes } from "@/content/enums";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const MainNav = () => {
    //--------------------------------------------------------------------------
    // Context
    const { cameraControllerRef, viewportRef, cameraEntity } = useContext(CameraContext);
    const { nodeGraph } = useContext(FactoryContext);
    const { selectedNode, setSelectedNode } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    // Handlers
    const itemClickedHandler = useCallback(
        (node: FactoryGraphNode) => {
            if (node !== selectedNode) {
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
        [setSelectedNode, cameraControllerRef, viewportRef, cameraEntity, selectedNode],
    );

    //--------------------------------------------------------------------------
    const factoryClickHandler = useCallback(() => {
        if (nodeGraph) setSelectedNode(nodeGraph);
    }, [nodeGraph, setSelectedNode]);

    //--------------------------------------------------------------------------
    // Render
    if (!nodeGraph?.areas?.length) return null;
    return (
        <ViewerPanel
            as="nav"
            className="h-fit flex divide-x divide-muted/50 rounded-md border border-muted/50 shadow-[-10px_10px_100px_35px_#ffffff50] overflow-hidden pointer-events-auto appear-in-from-bottom"
        >
            <div className="flex flex-col divide-y divide-muted/50">
                <div className="p-1">
                    <ul className="flex gap-1">
                        <li>
                            <Button variant="ghost" size="xs" className="h-full" onClick={factoryClickHandler}>
                                <Icon icon={faHome} size="lg" />
                            </Button>
                        </li>
                        {nodeGraph?.areas.map((area) => (
                            <AreaNode key={area.entity.euid.value} area={area} onClick={itemClickedHandler} />
                        ))}
                    </ul>
                </div>
            </div>
        </ViewerPanel>
    );
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const AreaNode = ({ area, onClick }: { area: AreaNode; onClick?: (node: FactoryGraphNode) => void }) => {
    //--------------------------------------------------------------------------
    // Contexts
    const { selectedNode } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    // Memos
    const isActive = useMemo(
        () => area === selectedNode || (selectedNode?.type === NodeTypes.cell && area === selectedNode?.parent),
        [area, selectedNode],
    );

    //--------------------------------------------------------------------------
    // Handlers
    const clickHandler = useCallback(
        (e: MouseEvent) => {
            e.stopPropagation();
            onClick?.(area);
        },
        [onClick, area],
    );

    //--------------------------------------------------------------------------
    // Render
    return (
        <li
            className={cn(
                "flex flex-col gap-1 p-1 bg-muted/5 border border-muted/50 rounded-xl cursor-pointer",
                isActive ? "text-accent-100 bg-accent-500 border-accent-500" : "",
            )}
            style={
                {
                    cornerShape: "squircle",
                } as React.CSSProperties
            }
            onClick={clickHandler}
        >
            <p className="px-1 text-[70%] uppercase">{area.name} area</p>
            <ul className="flex gap-1">
                {area.cells.map((cell) => (
                    <CellNode key={cell.entity.euid.value} area={area} cell={cell} onClick={onClick} />
                ))}
            </ul>
        </li>
    );
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const CellNode = ({
    area,
    cell,
    onClick,
}: {
    area: AreaNode;
    cell: CellNode;
    onClick?: (node: FactoryGraphNode) => void;
}) => {
    //--------------------------------------------------------------------------
    // Contexts
    const { selectedNode } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    // Memos
    const isActive = useMemo(() => selectedNode === cell, [selectedNode, cell]);

    //--------------------------------------------------------------------------
    const areaIsActive = useMemo(
        () =>
            selectedNode === area ||
            (selectedNode?.type === NodeTypes.cell && selectedNode.parent === area) ||
            isActive,
        [selectedNode, area, isActive],
    );

    //--------------------------------------------------------------------------
    // Handlers
    const clickHandler = useCallback(
        (e: MouseEvent) => {
            e.stopPropagation();
            onClick?.(cell);
        },
        [onClick, cell],
    );

    //--------------------------------------------------------------------------
    // Render
    return (
        <li>
            <button
                className={cn(
                    "px-3 py-1 text-xs capitalize bg-[white]/60 hover:bg-[white] rounded-md cursor-pointer transition-colors duration-200",
                    areaIsActive ? "bg-[white]/10 hover:bg-[white]/15" : "",
                    isActive ? "text-accent bg-white hover:bg-[white]" : "",
                )}
                style={
                    {
                        cornerShape: "squircle",
                    } as React.CSSProperties
                }
                onClick={clickHandler}
            >
                {cell.name}
            </button>
        </li>
    );
};

export default MainNav;
