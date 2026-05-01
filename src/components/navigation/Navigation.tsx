//------------------------------------------------------------------------------
import React, { useContext, useEffect, useMemo, useRef } from "react";
import { faArrowTurnDownRight, faHome } from "@fortawesome/sharp-light-svg-icons";
import { faExclamationTriangle, faWrench } from "@fortawesome/sharp-solid-svg-icons";

//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { Icon } from "@/components/common/Icon";
import Button from "@/components/common/Button";
import { BadgeOEE } from "@/components/common/BadgeOEE";

//------------------------------------------------------------------------------
import { FactoryContext } from "@/contexts/FactoryContext";
import { SelectionContext } from "@/contexts/SelectionContext";
import { ScenarioContext } from "@/contexts/ScenariosContext";

//------------------------------------------------------------------------------
import { isArea, isFactory, isLine, sortNode } from "@/core/SceneGraph";
import { useNavNode } from "./hooks";
import { useAreaOEE } from "@/hooks/useAreaOEE";
import { useOEEHistory } from "@/hooks/useOEEHistory";
import { cn } from "@/utils/cn";
import { useTimelineStore } from "@/store/useTimelineStore";
import { downtimeAtAsOf } from "@/components/timeline/timeUtils";

//------------------------------------------------------------------------------
import type { SceneGraphNode, AreaNode, CellNode, LineNode, AisleNode, RackNode } from "@/content/type";

//------------------------------------------------------------------------------
const SHOW_FLOW_BUTTON = false;

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const Navigation = ({ className }: { className?: string }) => {
    //--------------------------------------------------------------------------
    // Context
    const { nodeGraph } = useContext(FactoryContext);
    const { selectedNode, setSelectedNode } = useContext(SelectionContext);
    const areaNavListRef = useRef<HTMLUListElement>(null);

    //--------------------------------------------------------------------------
    const span = useTimelineStore((s) => s.span);
    const asOf = useTimelineStore((s) => s.asOf);
    const present = useTimelineStore((s) => s.present);

    //--------------------------------------------------------------------------
    const downtimeCellIds = useMemo(() => {
        if (!span) return new Set<string>();
        return new Set(
            [...span.downtimeEvents.values()]
                .filter((e) => downtimeAtAsOf(e, asOf || present))
                .map((e) => e.workCenterId),
        );
    }, [span, asOf, present]);

    const selectedAreaHash = useMemo(() => {
        if (!selectedNode || isFactory(selectedNode)) return undefined;

        let currentNode: SceneGraphNode | undefined = selectedNode;
        while (currentNode && !isArea(currentNode) && !isFactory(currentNode)) {
            if (!("parent" in currentNode)) return undefined;
            currentNode = currentNode.parent;
        }

        return currentNode && isArea(currentNode) ? currentNode.hash : undefined;
    }, [selectedNode]);

    //--------------------------------------------------------------------------
    // Flat ordered list: factory → for each area: area → sorted children (lines
    // first if sorted that way, then cells) → for each line its cells
    const flatNavList = useMemo<SceneGraphNode[]>(() => {
        const result: SceneGraphNode[] = [nodeGraph];
        for (const area of nodeGraph.areas) {
            result.push(area);
            const children = [...area.lines, ...area.cells].sort(sortNode);
            // const children = [...area.lines, ...area.cells, ...area.aisles, ...area.racks].sort(sortNode);
            for (const child of children) {
                result.push(child);
                if (isLine(child)) {
                    child.cells.forEach((cell) => result.push(cell));
                }
                // if (isAisle(child)) {
                //     child.racks.forEach((rack) => result.push(rack));
                // }
            }
        }
        return result;
    }, [nodeGraph]);

    //--------------------------------------------------------------------------
    // Arrow-key navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Escape") return;

            if (e.key === "Escape") {
                if (selectedNode && !isFactory(selectedNode)) {
                    setSelectedNode(selectedNode.parent);
                }
                return;
            }

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
    // Keep selected area centered on mobile horizontal navigation.
    useEffect(() => {
        if (!selectedAreaHash) return;
        if (!window.matchMedia("(max-width: 767px)").matches) return;

        const scrollContainer = areaNavListRef.current?.parentElement;
        if (!scrollContainer) return;

        const selectedAreaElement = areaNavListRef.current?.querySelector<HTMLElement>(
            `[data-area-hash="${selectedAreaHash}"]`,
        );
        if (!selectedAreaElement) return;

        const nextScrollLeft =
            selectedAreaElement.offsetLeft - (scrollContainer.clientWidth - selectedAreaElement.offsetWidth) / 2;
        const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;

        scrollContainer.scrollTo({
            left: Math.max(0, Math.min(nextScrollLeft, maxScrollLeft)),
            behavior: "smooth",
        });
    }, [selectedAreaHash]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <nav className="flex gap-2">
            <ViewerPanel
                className={cn(
                    "hidden md:flex h-auto border border-muted/50 shadow-[-10px_10px_100px_-15px_var(--color-slate-200)] pointer-events-auto select-none",
                    className,
                )}
            >
                <FactoryNav />
            </ViewerPanel>
            <ViewerPanel className="md:max-w-[90vw] p-1 overflow-x-auto bg-transparent md:bg-slate-0/97 border-none md:border border-muted/50 shadow-none md:shadow-[-10px_10px_100px_-15px_var(--color-slate-200)] pointer-events-auto select-none">
                <ul ref={areaNavListRef} className="list-none flex gap-1">
                    <li className="block md:hidden">
                        <FactoryNavMobile />
                    </li>
                    {nodeGraph.areas.map((area, index) => (
                        <AreaNav
                            key={area.hash}
                            area={area}
                            isFirst={index === 0}
                            index={index}
                            downtimeCellIds={downtimeCellIds}
                        />
                    ))}
                </ul>
            </ViewerPanel>
        </nav>
    );
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const FactoryNav = ({ className }: { className?: string }) => {
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
            return "text-accent-100 bg-accent border-accent-600";
        }
        if (isHovered) {
            return "border-accent-400";
        }
    }, [isSelected, isHovered]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <Button
            variant="ghost"
            size="xs"
            className={cn("h-auto", stateClassName, className)}
            onClick={clickHandler}
            onMouseEnter={mouseEnterHandler}
            onMouseLeave={mouseLeaveHandler}
        >
            <Icon icon={faHome} size="lg" />
        </Button>
    );
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const FactoryNavMobile = () => {
    //--------------------------------------------------------------------------
    // Contexts
    const { nodeGraph } = useContext(FactoryContext);

    //--------------------------------------------------------------------------
    // Hooks
    const { clickHandler, isSelected, isHovered } = useNavNode(nodeGraph, "nav");

    //--------------------------------------------------------------------------
    const stateClassName = useMemo(() => {
        if (isSelected) {
            return "bg-accent border-accent-600 text-accent-100";
        }
        if (isHovered) {
            return "bg-muted/5 border-accent-400";
        }
        return "bg-slate/50 border-transparent md:bg-muted/5 md:border-muted/50";
    }, [isSelected, isHovered]);

    //--------------------------------------------------------------------------
    return (
        <Button size="xs" onClick={clickHandler} className={cn("[writing-mode:sideways-lr]", stateClassName)}>
            Factory
        </Button>
    );
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const AreaNav = ({
    area,
    isFirst,
    index,
    downtimeCellIds,
}: {
    area: AreaNode;
    isFirst: boolean;
    index: number;
    downtimeCellIds: Set<string>;
}) => {
    //--------------------------------------------------------------------------
    // Hooks
    const { mouseLeaveHandler, mouseEnterHandler, isHovered, clickHandler, isSelected, isChildSelected } = useNavNode(
        area,
        "nav",
    );

    //--------------------------------------------------------------------------
    const oee = useAreaOEE(area);
    const oeeHistory = useOEEHistory(area);

    //--------------------------------------------------------------------------
    // Memos
    const children = useMemo(() => {
        //return [...area.lines, ...area.cells, ...area.aisles, ...area.racks].sort(sortNode);
        return [...area.lines, ...area.cells].sort(sortNode);
    }, [area]);

    //--------------------------------------------------------------------------
    const stateClassName = useMemo(() => {
        if (isSelected) {
            return "bg-accent border-accent-600 text-accent-100";
        }
        if (isChildSelected) {
            return "bg-accent/80 border-accent-600 text-accent-100";
        }
        if (isHovered) {
            return "bg-muted/5 border-accent-400";
        }
        return "bg-slate/50 border-transparent md:bg-muted/5 md:border-muted/50";
    }, [isSelected, isChildSelected, isHovered]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <li
            data-area-hash={area.hash}
            className={cn("relative flex flex-col gap-1 p-1 border rounded-lg cursor-pointer", stateClassName)}
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
            <div className="flex justify-between gap-1">
                <p className="px-1 text-[70%] uppercase whitespace-nowrap">{area.name} area</p>
                {area.name === "production" && oee !== undefined && (
                    <BadgeOEE oee={oee} oeeHistory={oeeHistory} hideLabel />
                )}
            </div>
            <ul className="flex overflow-visible">
                {children.map((child, index) => (
                    <ChildNode
                        key={child.hash}
                        isFirst={index === 0}
                        isLast={index === children.length - 1}
                        node={child}
                        downtimeCellIds={downtimeCellIds}
                    />
                ))}
            </ul>
        </li>
    );
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const ChildNode = ({
    node,
    isFirst,
    isLast,
    downtimeCellIds,
}: {
    node: LineNode | CellNode | AisleNode | RackNode;
    isFirst: boolean;
    isLast: boolean;
    downtimeCellIds: Set<string>;
}) => {
    //--------------------------------------------------------------------------
    // Hooks
    const { isActive, isParentActive, isHovered, clickHandler, mouseEnterHandler, mouseLeaveHandler } = useNavNode(
        node,
        "nav",
    );
    const { focus } = useContext(ScenarioContext);

    //--------------------------------------------------------------------------
    // Memos
    const hasDowntime = useMemo(
        () => (isLine(node) ? node.cells.some((c) => downtimeCellIds.has(c.hash)) : downtimeCellIds.has(node.hash)),
        [node, downtimeCellIds],
    );

    const isScenarioTarget = useMemo(
        () => (isLine(node) ? node.cells.some((c) => c.hash === focus?.cellHash) : node.hash === focus?.cellHash),
        [node, focus],
    );

    //--------------------------------------------------------------------------
    const stateClassName = useMemo(() => {
        if (isActive) {
            if (isHovered) {
                return "bg-slate-100 border-slate-100 text-accent";
            }
            return "bg-accent md:bg-slate-0 border-slate-0 md:text-accent";
        }
        if (isParentActive) {
            if (isHovered) {
                return "bg-accent-700 text-slate-0";
            } else {
                return "bg-accent border-accent-400";
            }
        }
        if (isHovered) {
            return "bg-accent-700 text-slate-0";
        }
        return "bg-slate-900 md:bg-slate-0 border-subtle/50 md:border-slate-0";
    }, [isActive, isParentActive, isHovered]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <li>
            <button
                data-scenario={
                    isScenarioTarget && focus?.kind === "predictive" ? "predictive-maintenance-step-2" : undefined
                }
                className={cn(
                    "relative px-2 py-1 text-xs capitalize whitespace-nowrap border rounded-md cursor-pointer transition-colors duration-200",
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
                {hasDowntime && (
                    <span className="absolute -top-2 right-px w-4 aspect-square bg-warning rounded-full">
                        <Icon icon={faExclamationTriangle} size="xs" className="text-warning-100" />
                    </span>
                )}
                {!hasDowntime && isScenarioTarget && focus?.kind === "predictive" && (
                    <span className="absolute -top-2 right-px w-4 aspect-square bg-amber-400 rounded-full">
                        <Icon icon={faWrench} size="xs" className="text-amber-900" />
                    </span>
                )}
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
