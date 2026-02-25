//------------------------------------------------------------------------------
import React, { useContext } from "react";
import { useCallback, useMemo, type MouseEvent } from "react";

//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";

//------------------------------------------------------------------------------
import { FactoryContext } from "@/contexts/FactoryContext";
import { SelectionContext } from "@/contexts/SelectionContext";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { AreaNode, CellNode, FactoryGraphNode } from "@/content/type";
import { NodeTypes } from "@/content/enums";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const MainNav = () => {
    //--------------------------------------------------------------------------
    // Context
    const { nodeGraph } = useContext(FactoryContext);
    const { setSelectedNode } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    // Handlers
    const itemClickedHandler = useCallback((node: FactoryGraphNode) => setSelectedNode(node), [setSelectedNode]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <ViewerPanel
            as="nav"
            className="h-fit flex divide-x divide-muted/50 rounded-md border border-muted/50 shadow-[-10px_10px_100px_35px_#ffffff50] overflow-hidden pointer-events-auto appear-in-from-bottom"
        >
            <div className="flex flex-col divide-y divide-muted/50">
                <div className="p-1">
                    <ul className="flex items-start gap-1">
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
                    "text-xs bg-[white]/60 hover:bg-[white] rounded-md px-3 py-1 cursor-pointer transition-colors duration-200",
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
