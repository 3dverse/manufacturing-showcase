//------------------------------------------------------------------------------
import { useCallback, useContext } from "react";
import { BoundingBoxFaceProjection } from "@3dverse/livelink-react-ui";
import { faExclamationTriangle } from "@fortawesome/sharp-regular-svg-icons";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";

//------------------------------------------------------------------------------
import { SelectionContext } from "@/contexts/SelectionContext";
import { useFocusStore } from "@/store/useFocusStore";
import { Router } from "@/core/Router";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { CellNode, SceneGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export function DowntimeFlag({ cell, downtimeId }: { cell: CellNode; downtimeId: string }) {
    //--------------------------------------------------------------------------
    // Context
    const { setSelectedNode } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    // Store
    const { setSelected } = useFocusStore();

    //--------------------------------------------------------------------------
    // Handlers
    const handleClick = useCallback(() => {
        const machine = cell.machines[0];
        setSelectedNode(machine || cell);
        setSelected({ type: "downtime", id: downtimeId });
        const { factorySlug } = Router.currentRoute();
        if (factorySlug) Router.replace({ factorySlug, nodeSlug: machine?.hash || cell.hash, itemSlug: downtimeId });
    }, [cell, downtimeId, setSelected, setSelectedNode]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <>
            <BoundingBoxFaceProjection
                entity={cell.entity}
                face="bottom"
                className="flex justify-center items-end pointer-events-none!"
            >
                <div className="rounded-full border-3 border-warning-700 w-10 h-10 translate-y-1/2" />
            </BoundingBoxFaceProjection>
            <BoundingBoxFaceProjection
                entity={cell.entity}
                face="front"
                className="flex justify-center items-end pointer-events-none!"
            >
                <div className="h-full w-[3px] bg-warning-700" />
            </BoundingBoxFaceProjection>
            <BoundingBoxFaceProjection entity={cell.entity} face="top" className="flex items-end justify-center">
                <div
                    className={cn(
                        "translate-y-1/2 flex flex-col items-center gap-2 bg-warning-700 text-warning-100 rounded-3xl [corner-shape:bevel] py-4 px-7 outline-4 outline-warning-700/50 outline-offset-8 cursor-pointer",
                        "hover:outline-offset-12 hover:outline-warning-700/80 transition-all duration-200",
                    )}
                    onClick={handleClick}
                >
                    <Icon icon={faExclamationTriangle} className="text-5xl" />
                    <p className="px-2 capitalize font-semibold text-warning-100">Incident on {cell.name}</p>
                </div>
            </BoundingBoxFaceProjection>
        </>
    );
}

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export function DowntimeFlagFront({
    node,
    cell,
    downtimeId,
}: {
    node: SceneGraphNode;
    cell: CellNode;
    downtimeId: string;
}) {
    //--------------------------------------------------------------------------
    // Context
    const { setSelectedNode } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    // Store
    const { setSelected } = useFocusStore();

    //--------------------------------------------------------------------------
    // Handlers
    const handleClick = useCallback(() => {
        const machine = cell.machines[0];
        setSelectedNode(machine || cell);
        setSelected({ type: "downtime", id: downtimeId });
        const { factorySlug } = Router.currentRoute();
        if (factorySlug) Router.replace({ factorySlug, nodeSlug: machine?.hash || cell.hash, itemSlug: downtimeId });
    }, [cell, downtimeId, setSelected, setSelectedNode]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <BoundingBoxFaceProjection
            entity={node.entity || cell.entity}
            face="front"
            className="flex items-end justify-center pointer-events-none!"
        >
            <div
                className={cn(
                    "flex flex-row items-center gap-2 bg-warning-700 text-warning-100 rounded-3xl [corner-shape:bevel] py-2 px-3 outline-4 outline-warning-700/50 outline-offset-8",
                    "pointer-events-auto cursor-pointer",
                    "hover:outline-offset-12 hover:outline-warning-700/80 transition-all duration-200",
                )}
                onClick={handleClick}
            >
                <Icon icon={faExclamationTriangle} className="text-2xl" />
                <p className="px-2 capitalize font-semibold text-warning-100">Incident</p>
            </div>
        </BoundingBoxFaceProjection>
    );
}
