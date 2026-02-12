//------------------------------------------------------------------------------
import type { Module as ModuleType } from "@/content/type";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export const Module = ({ module }: { module: ModuleType }) => {
    const { image, states } = module;

    //--------------------------------------------------------------------------
    const currentState = states?.[0];

    //--------------------------------------------------------------------------
    return (
        <div className="flex gap-2 mb-1 mt-4">
            {image && (
                <Box className="w-24 h-30 p-0">
                    <img src={image} alt={module?.name} className="w-full h-full object-contain" />
                </Box>
            )}
            <Box className="grow">
                <p className="text-sm">{module?.name}</p>
                {currentState?.picked_rate && <p className="text-sm">Picked rate: {currentState.picked_rate}%</p>}
                {currentState?.incidents && <p className="text-sm">Incidents: {currentState.incidents}</p>}
                {currentState?.quality_of_grip && (
                    <p className="text-sm">Quality of grip: {currentState.quality_of_grip}%</p>
                )}
                {currentState?.course && <p className="text-sm">Course: {currentState.course} mm</p>}
                {currentState?.units_picked && <p className="text-sm">Units picked: {currentState.units_picked}</p>}
            </Box>
        </div>
    );
};

//------------------------------------------------------------------------------
const Box = ({ children, className }: { children: React.ReactNode; className?: string }) => {
    return <div className={cn("bg-neutral-0/90 backdrop-blur-xl rounded-md px-3 py-2", className)}>{children}</div>;
};
