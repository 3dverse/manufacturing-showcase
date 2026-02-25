//------------------------------------------------------------------------------
import React, { useContext } from "react";
import { useCallback, useMemo, useState, type MouseEvent } from "react";

//------------------------------------------------------------------------------
import type { Entity } from "@3dverse/livelink";

//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";
import { FactoryContext } from "@/contexts/FactoryContext";
import { moveCamera } from "@/utils/camera-v2";
import type { AreaNode, CellNode } from "@/content/type";
import { CameraContext } from "@/contexts/CameraContext";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const MainNav = () => {
    //--------------------------------------------------------------------------
    // Context
    const factoryGraph = useContext(FactoryContext);
    const { cameraControllerRef, viewportRef, cameraEntity } = useContext(CameraContext);

    //--------------------------------------------------------------------------
    // State
    const [activeAreaEUID, setActiveAreaId] = useState<string>();
    const [activeCellEUID, setActiveCellId] = useState<string>();

    //--------------------------------------------------------------------------
    // Memos
    const factory = useMemo(
        () => (factoryGraph.factories.length > 0 ? factoryGraph.factories[0] : undefined),
        [factoryGraph],
    );

    //--------------------------------------------------------------------------
    // Handlers
    const handleItemClicked = useCallback(
        (area: Entity, cell?: Entity) => {
            setActiveAreaId(area.euid.value);
            setActiveCellId(cell?.euid.value);
            console.log("?", cameraControllerRef.current, viewportRef.current, cameraEntity);
            if (cameraControllerRef.current && viewportRef.current && cameraEntity) {
                moveCamera(cell || area, cameraControllerRef.current, viewportRef.current, cameraEntity);
            }
        },
        [cameraControllerRef, viewportRef, cameraEntity],
    );

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
                        {factory?.areas.map((area) => (
                            <AreaNode
                                key={area.entity.euid.value}
                                area={area}
                                activeAreaEUID={activeAreaEUID}
                                activeCellEUID={activeCellEUID}
                                onClick={handleItemClicked}
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
    activeAreaEUID,
    activeCellEUID,
    onClick,
}: {
    area: AreaNode;
    activeAreaEUID?: string;
    activeCellEUID?: string;
    onClick?: (area: Entity, cell?: Entity) => void;
}) => {
    //--------------------------------------------------------------------------
    // Handlers
    const clickHandler = useCallback(
        (e: MouseEvent) => {
            e.stopPropagation();
            onClick?.(area.entity);
        },
        [onClick, area.entity],
    );

    //--------------------------------------------------------------------------
    // Render
    return (
        <li
            className={cn(
                "flex flex-col gap-1 p-1 bg-muted/5 border border-muted/50 rounded-xl cursor-pointer",
                area.entity.euid.value === activeAreaEUID ? "text-accent-100 bg-accent-500 border-accent-500" : "",
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
                    <CellNode
                        key={cell.entity.euid.value}
                        area={area}
                        cell={cell}
                        activeAreaEUID={activeAreaEUID}
                        activeCellEUID={activeCellEUID}
                        onClick={onClick}
                    />
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
    activeAreaEUID,
    activeCellEUID,
    onClick,
}: {
    area: AreaNode;
    cell: CellNode;
    activeAreaEUID?: string;
    activeCellEUID?: string;
    onClick?: (area: Entity, cell?: Entity) => void;
}) => {
    //--------------------------------------------------------------------------
    // Handlers
    const clickHandler = useCallback(
        (e: MouseEvent) => {
            e.stopPropagation();
            onClick?.(area.entity, cell.entity);
        },
        [onClick, area.entity, cell.entity],
    );

    //--------------------------------------------------------------------------
    // Render
    return (
        <li>
            <button
                className={cn(
                    "text-xs bg-[white]/60 hover:bg-[white] rounded-md px-3 py-1 cursor-pointer transition-colors duration-200",
                    area.entity.euid.value === activeAreaEUID ? "bg-[white]/10 hover:bg-[white]/15" : "",
                    area.entity.euid.value === activeAreaEUID && cell.entity.euid.value === activeCellEUID
                        ? "text-accent bg-white hover:bg-[white]"
                        : "",
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
