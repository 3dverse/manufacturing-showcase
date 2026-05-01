//------------------------------------------------------------------------------
import { useContext } from "react";

//------------------------------------------------------------------------------
import { ScenarioContext } from "@/contexts/ScenariosContext";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export const ScenariosWheel = () => {
    //--------------------------------------------------------------------------
    const { scenarios, activeScenarioId, activateScenario, clearActiveScenario } = useContext(ScenarioContext);

    //--------------------------------------------------------------------------
    const toggleScenario = (scenarioId: string) => {
        if (activeScenarioId === scenarioId) {
            clearActiveScenario();
        } else {
            activateScenario(scenarioId);
        }
    };

    //--------------------------------------------------------------------------
    return (
        <div className="relative flex justify-center items-center w-full h-full">
            <div className="absolute bottom-0 w-full max-w-70 aspect-2/1 grid grid-cols-3 items-center text-center rounded-t-full bg-ground border border-b-0 border-slate-100 overflow-hidden translate-y-24 group-hover:translate-y-2 transition-transform duration-220">
                {Object.entries(scenarios).map(([scenarioId, scenario], index) => (
                    <button
                        key={scenarioId}
                        className={cn(
                            "relative flex justify-center items-center h-full text-xs text-slate-200 border transition-colors duration-300 cursor-pointer",
                            "before:content-[''] before:absolute before:bottom-0 before:bg-guidance-600 hover:before:bg-guidance before:w-[160%] before:h-[160%] before:transition-colors before:duration-300",
                            index === 0 &&
                                "pb-12 -rotate-30 translate-x-1/2 origin-bottom-right before:right-0 [&_p]:-rotate-20",
                            index === 1 && "pb-12 -z-10",
                            index === 2 &&
                                "pb-12 rotate-30 -translate-x-1/2 origin-bottom-left before:left-0 [&_p]:rotate-20",
                            activeScenarioId === scenarioId && "text-slate-0 before:bg-guidance",
                            scenario.disabled && "bg-accent-100! hover:bg-accent-100! cursor-not-allowed",
                        )}
                        onClick={() => toggleScenario(scenarioId)}
                        disabled={scenario.disabled}
                    >
                        <p className="relative z-10">{scenario.title}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};
