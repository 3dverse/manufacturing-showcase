//------------------------------------------------------------------------------
import Button from "@/components/common/Button";

//------------------------------------------------------------------------------
import type { ScenarioIncident } from "@/content/type";

//------------------------------------------------------------------------------
export const IncidentCallout = ({ incident }: { incident: ScenarioIncident }) => {
    //--------------------------------------------------------------------------
    return (
        <div className="relative rounded-md border border-warning-400/70 bg-slate-0/95 px-3 py-2 shadow-lg starting:opacity-0 starting:translate-y-2 opacity-100 translate-y-0 transition-all duration-400">
            <p className="text-xs font-semibold text-muted">{incident.title}</p>
            <p className="mt-1 text-xs text-warning-700">{incident.warningMessage}</p>
            <div className="mt-2 flex items-center justify-between gap-1">
                {incident.actions.map((action) => (
                    <Button
                        variant="ghost"
                        size="xs"
                        // disabled={Boolean(action.disabled)}
                        className="border border-warning-300/60 text-warning-700 pointer-events-none"
                    >
                        {action.label}
                    </Button>
                ))}
            </div>
        </div>
    );
};
