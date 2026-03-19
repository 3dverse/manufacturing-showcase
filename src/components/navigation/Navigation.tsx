//------------------------------------------------------------------------------
import React, { useContext, useEffect, useMemo } from "react";
import { faArrowTurnDownRight, faHome } from "@fortawesome/sharp-light-svg-icons";

//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { Icon } from "@/components/common/Icon";
import Button from "@/components/common/Button";

//------------------------------------------------------------------------------
import { FactoryContext } from "@/contexts/FactoryContext";
import { SelectionContext } from "@/contexts/SelectionContext";

//------------------------------------------------------------------------------
import { isLine, sortNode } from "@/core/NavGraph";
import type { NavGraphNode } from "@/content/type";
import { useNavNode } from "./hooks";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { AreaNode, CellNode, LineNode } from "@/content/type";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const Navigation = () => {
    //--------------------------------------------------------------------------
    // Context
    const { nodeGraph } = useContext(FactoryContext);
    console.log(nodeGraph);
    const { selectedNode, setSelectedNode } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    // Flat ordered list: factory → for each area: area → sorted children (lines
    // first if sorted that way, then cells) → for each line its cells
    const flatNavList = useMemo<NavGraphNode[]>(() => {
        const result: NavGraphNode[] = [nodeGraph];
        for (const area of nodeGraph.areas) {
            result.push(area);
            const children = [...area.lines, ...area.cells].sort(sortNode);
            for (const child of children) {
                result.push(child);
                if (isLine(child)) {
                    child.cells.forEach((cell) => result.push(cell));
                }
            }
        }
        return result;
    }, [nodeGraph]);

    //--------------------------------------------------------------------------
    // Arrow-key navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;

            const currentIndex = selectedNode ? flatNavList.findIndex((n) => n.hash === selectedNode.hash) : -1;

            if (e.key === "ArrowLeft") {
                const prevIndex = currentIndex <= 0 ? flatNavList.length - 1 : currentIndex - 1;
                setSelectedNode(flatNavList[prevIndex]);
            } else {
                const nextIndex = currentIndex >= flatNavList.length - 1 ? 0 : currentIndex + 1;
                setSelectedNode(flatNavList[nextIndex]);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [flatNavList, selectedNode, setSelectedNode]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <ViewerPanel
            as="nav"
            className="select-none h-fit flex divide-x divide-muted/50 rounded-md border border-muted/50 shadow-[-10px_10px_100px_-15px_var(--color-slate-200)] overflow-hidden pointer-events-auto appear-in-from-bottom"
        >
            <div className="flex flex-col divide-y divide-muted/50">
                <div className="p-1">
                    <ul className="flex gap-1">
                        <FactoryNav />
                        {nodeGraph.areas.map((area, index) => (
                            <AreaNav key={area.hash} area={area} isFirst={index === 0} index={index} />
                        ))}
                    </ul>
                </div>
            </div>
        </ViewerPanel>
    );
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const FactoryNav = () => {
    //--------------------------------------------------------------------------
    // Contexts
    const { nodeGraph } = useContext(FactoryContext);

    //--------------------------------------------------------------------------
    // Hooks
    const { clickHandler, isSelected, isHovered, mouseLeaveHandler, mouseEnterHandler } = useNavNode(nodeGraph, "nav");

    //--------------------------------------------------------------------------
    // Memos
    const stateClassName = useMemo(() => {
        if (isSelected) {
            return "text-accent-100 bg-accent-500 border-accent-600";
        }
        if (isHovered) {
            return "border-accent-400";
        }
    }, [isSelected, isHovered]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <li>
            <Button
                variant="ghost"
                size="xs"
                className={cn("h-full", stateClassName)}
                onClick={clickHandler}
                onMouseEnter={mouseEnterHandler}
                onMouseLeave={mouseLeaveHandler}
            >
                <Icon icon={faHome} size="lg" />
            </Button>
        </li>
    );
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const AreaNav = ({ area, isFirst, index }: { area: AreaNode; isFirst: boolean; index: number }) => {
    //--------------------------------------------------------------------------
    // Hooks
    const { mouseLeaveHandler, mouseEnterHandler, isHovered, clickHandler, isSelected, isChildSelected } = useNavNode(
        area,
        "nav",
    );

    //--------------------------------------------------------------------------
    // Memos
    const children = useMemo(() => [...area.lines, ...area.cells].sort(sortNode), [area]);

    //--------------------------------------------------------------------------
    const stateClassName = useMemo(() => {
        if (isSelected || isChildSelected) {
            return "bg-accent-500 border-accent-600 text-accent-100";
        }
        if (isHovered) {
            return "bg-muted/5 border-accent-400";
        }
        return "bg-muted/5 border-muted/50";
    }, [isSelected, isChildSelected, isHovered]);

    const SHOW_FLOW_BUTTON = false;

    //--------------------------------------------------------------------------
    // Render
    return (
        <li
            className={cn("relative flex flex-col gap-1 p-1 border rounded-xl cursor-pointer", stateClassName)}
            style={
                SHOW_FLOW_BUTTON
                    ? ({
                          cornerShape: "squircle",
                          borderEndEndRadius: isFirst ? "1.5rem" : undefined,
                          cornerEndEndShape: isFirst ? "scoop" : undefined,
                          borderEndStartRadius: index === 1 ? "1.5rem" : undefined,
                          cornerEndStartShape: index === 1 ? "scoop" : undefined,
                      } as React.CSSProperties)
                    : undefined
            }
            onClick={clickHandler}
            onMouseEnter={mouseEnterHandler}
            onMouseLeave={mouseLeaveHandler}
        >
            {/* Show a flow button for the first area. Just to try */}
            {SHOW_FLOW_BUTTON && index === 0 && <FlowNode isSelected={isSelected} />}
            <p className="px-1 text-[70%] uppercase whitespace-nowrap">{area.name} area</p>
            <ul className="flex overflow-x-auto">
                {children.map((child, index) => (
                    <ChildNode
                        key={child.hash}
                        isFirst={index === 0}
                        isLast={index === children.length - 1}
                        node={child}
                    />
                ))}
            </ul>
        </li>
    );
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const ChildNode = ({ node, isFirst, isLast }: { node: LineNode | CellNode; isFirst: boolean; isLast: boolean }) => {
    //--------------------------------------------------------------------------
    // Hooks
    const { isActive, isParentActive, isHovered, clickHandler, mouseEnterHandler, mouseLeaveHandler } = useNavNode(
        node,
        "nav",
    );

    //--------------------------------------------------------------------------
    // Memos
    const stateClassName = useMemo(() => {
        if (isActive) {
            if (isHovered) {
                return "bg-slate-100 border-slate-100 text-accent";
            }
            return "bg-slate-0 border-slate-0 text-accent";
        }
        if (isParentActive) {
            if (isHovered) {
                return "bg-accent-700 text-slate-0";
            } else {
                return "bg-accent-500 border-accent-400";
            }
        }
        if (isHovered) {
            return "bg-accent-700 text-slate-0";
        }
        return "bg-slate-0 border-slate-0";
    }, [isActive, isParentActive, isHovered]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <li>
            <button
                className={cn(
                    "relative px-2 py-1 text-xs capitalize whitespace-nowrap  border  rounded-md cursor-pointer transition-colors duration-200",
                    stateClassName,
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
                onMouseEnter={mouseEnterHandler}
                onMouseLeave={mouseLeaveHandler}
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
                {node.name} {isLine(node) && "Line"}
            </button>
        </li>
    );
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const FlowNode = ({ isSelected }: { isSelected: boolean }) => {
    return (
        <span
            className={cn(
                "absolute -bottom-px -right-6 flex items-center justify-center w-[43px] h-5 text-default bg-muted/5 border border-muted/50 rounded-t-3xl cursor-pointer",
                isSelected ? "bg-guidance border-guidance-600 text-guidance-900" : "hover:border-muted",
            )}
        >
            <Icon icon={faArrowTurnDownRight} size="2xs" className="mt-1" />
        </span>
    );
};
