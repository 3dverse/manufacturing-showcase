//------------------------------------------------------------------------------
import Button from "@/components/common/Button";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { ScenarioIncident } from "@/content/type";

//------------------------------------------------------------------------------
export const ScadaEventsCallout = ({ incident, className }: { incident: ScenarioIncident, className?: string }) => {

    //--------------------------------------------------------------------------
    const canStopMachine = true;

    //--------------------------------------------------------------------------
    return (
        <div
            data-scenario="incident-step-2"
            className={cn("relative rounded-md border border-warning-400/70 bg-slate-0/95 px-3 py-2 shadow-lg starting:opacity-0 starting:translate-y-2 opacity-100 translate-y-0 transition-all duration-400", className)}
        >
            <p className="text-xs font-semibold text-muted">{incident.title}</p>
            <p className="mt-1 text-xs text-warning-700">{incident.warningMessage}</p>
            <div className="mt-2 flex items-center justify-end gap-1">
                {canStopMachine && (
                    <Button
                        variant="ghost"
                        size="xs"
                        disabled
                        className="border border-warning-300/60 text-warning-700 pointer-events-none"
                    >
                        Stop machine
                    </Button>
                )}
                <Button
                    variant="plain"
                    colorScheme="warning"
                    size="xs"
                >
                    Go to incident
                </Button>
            </div>
        </div>
    );
};
