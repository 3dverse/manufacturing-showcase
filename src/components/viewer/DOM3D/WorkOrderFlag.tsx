//------------------------------------------------------------------------------
import { useContext } from "react";
import { BoundingBoxFaceProjection } from "@3dverse/livelink-react-ui";
import { faWrench } from "@fortawesome/sharp-regular-svg-icons";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";

//------------------------------------------------------------------------------
import { SelectionContext } from "@/contexts/SelectionContext";
import { useFocusStore } from "@/store/useFocusStore";
import { Router } from "@/core/Router";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { MachineNode } from "@/content/type";

//------------------------------------------------------------------------------
export function WorkOrderFlag({ machine, workOrderId }: { machine: MachineNode; workOrderId: string }) {
    //--------------------------------------------------------------------------
    const { setSelectedNode } = useContext(SelectionContext);
    const { setSelected } = useFocusStore();

    //--------------------------------------------------------------------------
    const handleClick = () => {
        setSelectedNode(machine);
        setSelected({ type: "workOrder", id: workOrderId });
        const { factorySlug } = Router.currentRoute();
        if (factorySlug) Router.replace({ factorySlug, nodeSlug: machine.hash, itemSlug: workOrderId });
    };

    //--------------------------------------------------------------------------
    return (
        <>
            <BoundingBoxFaceProjection
                entity={machine.entity}
                face="bottom"
                className="flex justify-center items-end pointer-events-none!"
            >
                <div className="rounded-full border-3 border-amber-400 w-10 h-10 translate-y-1/2" />
            </BoundingBoxFaceProjection>
            <BoundingBoxFaceProjection
                entity={machine.entity}
                face="front"
                className="flex justify-center items-end pointer-events-none!"
            >
                <div className="h-full w-[3px] bg-amber-400" />
            </BoundingBoxFaceProjection>
            <BoundingBoxFaceProjection entity={machine.entity} face="top" className="flex items-end justify-center">
                <div
                    className={cn(
                        "translate-y-1/2 flex flex-col items-center gap-2 bg-amber-400 text-amber-950 rounded-3xl [corner-shape:bevel] py-4 px-7 outline-4 outline-amber-400/50 outline-offset-8 cursor-pointer",
                        "hover:outline-offset-12 hover:outline-amber-400/80 transition-all duration-200",
                    )}
                    onClick={handleClick}
                >
                    <Icon icon={faWrench} className="text-5xl" />
                    <p className="px-2 capitalize font-semibold">Maintenance on {machine.name}</p>
                </div>
            </BoundingBoxFaceProjection>
        </>
    );
}
