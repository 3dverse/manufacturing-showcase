//------------------------------------------------------------------------------
import { useContext, useEffect, useState } from "react";

//------------------------------------------------------------------------------
import { ScenariosWheel } from "./ScenariosWheel";
import { ScenarioContext } from "@/contexts/ScenariosContext";

//------------------------------------------------------------------------------
import { CONTACT_URL, LANDING_3DVERSE_URL } from "@/content/routes";
import { METADATA } from "@/content/metadata";

//------------------------------------------------------------------------------
export const MainGuidance = () => {
    //--------------------------------------------------------------------------
    const { scenarios, activeScenarioId, scenarioActivatedAt } = useContext(ScenarioContext);
    const [isRetracting, setIsRetracting] = useState(false);
    const activeScenario = scenarios.find((s) => s.id === activeScenarioId);

    //--------------------------------------------------------------------------
    useEffect(() => {
        if (!scenarioActivatedAt) return;

        setIsRetracting(true);
        const timeout = window.setTimeout(() => setIsRetracting(false), 500);

        return () => window.clearTimeout(timeout);
    }, [scenarioActivatedAt]);

    //--------------------------------------------------------------------------
    return (
        <aside
            data-theme="dark"
            className={`
                group fixed bottom-0
                shadow-[0_-4px_32px_-1px_color-mix(in_oklch,var(--color-accent-200)_20%,transparent)] z-300
                ${isRetracting ? "pointer-events-none" : ""}
            `}
            {...(activeScenario && { "data-current-scenario": true })}
        >
            <div
                className={`
                    absolute bottom-0 left-0 h-18 w-screen grid grid-cols-3 items-center px-4 bg-slate-0 text-default
                    translate-y-full group-hover:translate-y-0 transition-transform duration-200
                `}
            >
                <div className="flex flex-col">
                    <a
                        href={LANDING_3DVERSE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 w-fit pl-2 pr-4 py-1 rounded-lg hover:bg-slate-100 transition-colors duration-200"
                    >
                        <img src="/logo/3dverse_rocket.svg" alt="3dverse" className="w-8 h-8" />
                        <div className="flex flex-col">
                            <span>{METADATA.app_name}</span>
                            <span className="text-xs text-muted">
                                Powered by <span className="font-family-heading text-guidance">3dverse</span>
                            </span>
                        </div>
                    </a>
                </div>

                <ScenariosWheel />

                <div className="flex justify-end">
                    <a
                        href={CONTACT_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 w-fit px-3 py-2 text-xs text-guidance rounded border border-guidance/50 hover:border-guidance/80 transition-colors duration-200"
                    >
                        Contact 3dverse
                    </a>
                </div>
            </div>
            <header
                className={`
                    fixed bottom-0 left-1/2 -translate-x-1/2 flex items-center w-fit justify-between gap-2 p-2 pb-1 bg-slate-0 rounded-t-[1.9rem] [corner-shape:round] cursor-pointer
                    before:content-[''] before:absolute before:bottom-0 before:left-0 before:-translate-x-full before:w-5 before:h-5 before:bg-slate-50 before:rounded-tl-4xl before:[corner-shape:scoop]
                    after:content-[''] after:absolute after:bottom-0 after:right-0 after:translate-x-full after:w-5 after:h-5 after:bg-slate-50 after:rounded-tr-4xl after:[corner-shape:scoop]
                    group-data-current-use-case:pl-4
                    transition-all duration-200
                    shadow-[0_4px_20px_10px_#ffffff30]
                `}
            >
                {activeScenario ? (
                    <div className="flex flex-col text-center px-2">
                        <p className="text-2xs text-subtle">Scenario</p>
                        <p className="text-xs text-guidance">{activeScenario.title}</p>
                    </div>
                ) : (
                    <img src="/logo/3dverse_rocket.svg" alt="3dverse" className="w-6 h-6" />
                )}
            </header>
        </aside>
    );
};
