//------------------------------------------------------------------------------
import { useMemo } from "react";
import { DOM3DAnchor } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import type { MachineNode } from "@/content/type";
import { getMachineDocumentation } from "@/content/machine";

//------------------------------------------------------------------------------
export function MachineLabel({ machine }: { machine: MachineNode }) {
    //--------------------------------------------------------------------------
    const worldPosition = useMemo(() => {
        return machine.entity.global_transform.position;
    }, [machine.entity.global_transform.position]);

    //--------------------------------------------------------------------------
    const machineDetails = getMachineDocumentation(machine.entity.name);

    //--------------------------------------------------------------------------
    return (
        <DOM3DAnchor worldPosition={worldPosition}>
            <div className="relative starting:-translate-x-32 starting:opacity-0 -translate-x-38 -translate-y-48 pb-32 pr-32 opacity-100 transition-all duration-300 delay-1000">
                <p className="relative max-w-xs text-xl text-white border-b pb-2 pr-8 capitalize [text-shadow:1px_1px_20px_black]">
                    {machineDetails.name}
                    <span className="absolute -bottom-[2px] right-px -rotate-135 origin-top-right w-44 border-b border-white" />
                </p>
                <span className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-3 aspect-square rounded-full border border-white" />
            </div>
        </DOM3DAnchor>
    );
}
