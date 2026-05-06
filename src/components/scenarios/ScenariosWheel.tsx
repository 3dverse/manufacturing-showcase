//------------------------------------------------------------------------------
import { useContext } from "react";

//------------------------------------------------------------------------------
import { ScenarioContext } from "@/contexts/ScenariosContext";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export const ScenariosWheel = ({ isOpen = false, onSelect }: { isOpen?: boolean; onSelect?: () => void }) => {
    //--------------------------------------------------------------------------
    const { scenarios, activeScenarioId, activateScenario, clearActiveScenario } = useContext(ScenarioContext);

    //--------------------------------------------------------------------------
    const toggleScenario = (scenarioId: string) => {
        if (activeScenarioId === scenarioId) {
            clearActiveScenario();
        } else {
            activateScenario(scenarioId);
            onSelect?.();
        }
    };

    //--------------------------------------------------------------------------
    return (
        <div className="relative flex justify-center items-center w-full h-full">
            <div
                className={cn(
                    "absolute bottom-0 w-full max-w-70 aspect-2/1 grid grid-cols-3 items-center text-center rounded-t-full bg-ground border border-b-0 border-slate-100 overflow-hidden transition-transform duration-220",
                    isOpen ? "translate-y-2" : "translate-y-24 group-hover:translate-y-2",
                )}
            >
                {scenarios.map((scenario, index) => (
                    <button
                        key={scenario.id}
                        className={cn(
                            "relative flex justify-center items-center h-full text-xs text-slate-200 border transition-colors duration-300",
                            "before:content-[''] before:absolute before:bottom-0 before:w-[160%] before:h-[160%] before:transition-colors before:duration-300",
                            index === 0 &&
                            "pb-12 -rotate-30 translate-x-1/2 origin-bottom-right before:right-0 [&_p]:-rotate-20",
                            index === 1 && "pb-12 -z-10",
                            index === 2 &&
                            "pb-12 rotate-30 -translate-x-1/2 origin-bottom-left before:left-0 [&_p]:rotate-20",
                            scenario.disabled
                                ? "cursor-not-allowed before:bg-slate-600 text-slate-400"
                                : "cursor-pointer before:bg-guidance-600 hover:before:bg-guidance",
                            activeScenarioId === scenario.id && "text-slate-0 before:bg-guidance",
                        )}
                        onClick={() => toggleScenario(scenario.id)}
                        disabled={scenario.disabled}
                    >
                        <p className="relative z-10 max-w-[10ch]">{scenario.title}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};
