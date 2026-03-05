//------------------------------------------------------------------------------
import React, { useContext, useCallback, useMemo, type MouseEvent } from "react";
import { faArrowTurnDownRight, faHome } from "@fortawesome/sharp-light-svg-icons";

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
import type { AreaNode, CellNode, FactoryGraphNode, LineNode } from "@/content/type";
import { NodeTypes } from "@/content/enums";
import { sortNode } from "@/utils/FactoryGraph";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const MainNav = () => {
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
            className="h-fit flex divide-x divide-muted/50 rounded-md border border-muted/50 shadow-[-10px_10px_100px_-15px_var(--color-slate-200)] overflow-hidden pointer-events-auto appear-in-from-bottom"
        >
            <div className="flex flex-col divide-y divide-muted/50">
                <div className="p-1">
                    <ul className="flex gap-1">
                        <li>
                            <Button variant="ghost" size="xs" className="h-full" onClick={factoryClickHandler}>
                                <Icon icon={faHome} size="lg" />
                            </Button>
                        </li>
                        {nodeGraph?.areas.map((area, index) => (
                            <AreaNode
                                key={area.entity.euid.value}
                                area={area}
                                isFirst={index === 0}
                                index={index}
                                onClick={itemClickedHandler}
                            />
                        ))}
                    </ul>
                </div>
            </div>
        </ViewerPanel>
    );
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const AreaNode = ({
    area,
    isFirst,
    index,
    onClick,
}: {
    area: AreaNode;
    isFirst: boolean;
    index: number;
    onClick?: (node: FactoryGraphNode) => void;
}) => {
    //--------------------------------------------------------------------------
    // Contexts
    const { selectedNode } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    // Memos
    const isActive = useMemo(
        () => area === selectedNode || area === (selectedNode as LineNode | CellNode)?.parent,
        [area, selectedNode],
    );

    //--------------------------------------------------------------------------
    const children = useMemo(() => [...area.lines, ...area.cells].sort(sortNode), [area]);

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
                "relative flex flex-col gap-1 p-1 bg-muted/5 border border-muted/50 rounded-xl cursor-pointer",
                isActive ? "text-accent-100 bg-accent-500 border-accent-600" : "hover:border-muted",
            )}
            style={
                {
                    cornerShape: "squircle",
                    borderEndEndRadius: isFirst ? "1.5rem" : undefined,
                    cornerEndEndShape: isFirst ? "scoop" : undefined,
                    borderEndStartRadius: index === 1 ? "1.5rem" : undefined,
                    cornerEndStartShape: index === 1 ? "scoop" : undefined,
                } as React.CSSProperties
            }
            onClick={clickHandler}
        >
            {/* Show a flow button for the first area. Just to try */}
            {index === 0 && <FlowNode isActive={isActive} />}
            <p className="px-1 text-[70%] uppercase whitespace-nowrap">{area.name} area</p>
            <ul className="flex overflow-x-auto">
                {children.map((child, index) => (
                    <ChildNode
                        key={child.entity.euid.value}
                        isAreaActive={isActive}
                        isFirst={index === 0}
                        isLast={index === children.length - 1}
                        node={child}
                        onClick={onClick}
                    />
                ))}
            </ul>
        </li>
    );
};

//------------------------------------------------------------------------------
const FlowNode = ({ isActive }: { isActive: boolean }) => {
    return (
        <span
            className={cn(
                "absolute -bottom-px -right-6 flex items-center justify-center w-[43px] h-5 text-default bg-muted/5 border border-muted/50 rounded-t-3xl cursor-pointer",
                isActive ? "bg-guidance border-guidance-600 text-guidance-900" : "hover:border-muted",
            )}
        >
            <Icon icon={faArrowTurnDownRight} size="2xs" className="mt-1" />
        </span>
    );
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const ChildNode = ({
    node,
    isFirst,
    isLast,
    isAreaActive,
    onClick,
}: {
    node: LineNode | CellNode;
    isFirst: boolean;
    isLast: boolean;
    isAreaActive: boolean;
    onClick?: (node: FactoryGraphNode) => void;
}) => {
    //--------------------------------------------------------------------------
    // Contexts
    const { selectedNode } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    // Memos
    const isActive = useMemo(() => selectedNode === node, [selectedNode, node]);
    const isActiveChildOfLine = useMemo(() => {
        return !!(selectedNode && selectedNode.type === NodeTypes.cell && selectedNode.parent?.type === NodeTypes.line);
    }, [selectedNode]);

    //--------------------------------------------------------------------------
    // Handlers
    const clickHandler = useCallback(
        (e: MouseEvent) => {
            e.stopPropagation();
            onClick?.(node);
        },
        [onClick, node],
    );

    //--------------------------------------------------------------------------
    // Render
    return (
        <li>
            <button
                className={cn(
                    "relative px-2 py-1 text-xs capitalize whitespace-nowrap bg-slate-0 hover:text-accent border border-slate-100 rounded-md cursor-pointer transition-colors duration-200",
                    isAreaActive ? "bg-accent-500 hover:bg-accent-700 hover:text-slate-0 border-accent-400" : "",
                    isActive || isActiveChildOfLine
                        ? "text-accent hover:text-accent bg-slate-0 hover:bg-slate-100 border-slate-0"
                        : "hover:border-muted",
                )}
                style={
                    {
                        paddingInlineStart: isFirst ? undefined : "16px",
                        borderStartStartRadius: isFirst ? "6px" : "0",
                        borderStartEndRadius: isLast ? "6px" : "0",
                        borderEndStartRadius: isFirst ? "6px" : "0",
                        borderEndEndRadius: isLast ? "6px" : "0",
                    } as React.CSSProperties
                }
                onClick={clickHandler}
            >
                {!isLast && (
                    <span
                        className="absolute -top-px box-content -right-2 h-full w-2 bg-inherit aspect-square rounded-s-none rounded-ee-[50%] z-10 border-r border-t border-b border-inherit transition-colors duration-200"
                        style={
                            {
                                cornerShape: "squircle superellipse(.4) superellipse(.4) squircle",
                            } as React.CSSProperties
                        }
                    />
                )}
                {node.name} {node.type === NodeTypes.line && "Line"}
            </button>
        </li>
    );
};
