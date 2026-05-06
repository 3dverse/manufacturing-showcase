import { useContext, useEffect, useState, useCallback } from "react";

//------------------------------------------------------------------------------
import { FactoriesContext } from "@/contexts/FactoriesContext";

//------------------------------------------------------------------------------
import { FactoryItem } from "@/components/nodes/factory/FactoryItem";
import { ManufacturingOrderPlanning } from "@/components/manufacturingOrders/ManufacturingOrderPlanning";
import { ScenarioStepper } from "@/components/scenarios/ScenarioStepper";
import { ClientProductLogo } from "@/components/common/icons/ClientProductLogo";

//------------------------------------------------------------------------------
import { DevMode } from "@/content/3dverse";
import { useTimelineStore } from "@/store/useTimelineStore";
import type { StoppageEvent } from "@/components/scadaEvents/StoppageCallout";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export default function HomePage() {
    //--------------------------------------------------------------------------
    const { factories } = useContext(FactoriesContext);
    const loadSpan = useTimelineStore((s) => s.loadSpan);
    const [stoppages, setStoppages] = useState<Map<string, StoppageEvent | null>>(new Map());

    useEffect(() => {
        for (const factory of factories) {
            if (factory.enabled) loadSpan(factory.scene_id);
        }
    }, [factories, loadSpan]);

    const makeStoppageHandler = useCallback(
        (siteId: string) => (stoppage: StoppageEvent | null) => {
            setStoppages((prev) => {
                if (prev.get(siteId) === stoppage) return prev;
                const next = new Map(prev);
                next.set(siteId, stoppage);
                return next;
            });
        },
        [],
    );

    //--------------------------------------------------------------------------
    // Render
    return (
        <div className="flex flex-col min-h-dvh bg-linear-to-br from-slate-50 to-slate-100 overflow-x-hidden">
            <div className="container flex flex-col grow mx-auto">
                <header className="relative flex items-start gap-4 py-4 md:py-8 lg:py-10 px-4 2xl:px-0">
                    <ClientProductLogo className="-translate-y-px" />
                    <h1 className="text-accent-900 text-xl font-bold">PPL Industry</h1>
                    {DevMode.active && (
                        <a
                            href="/dataset"
                            className="absolute bottom-3 right-12 text-xs text-accent hover:text-accent-600 transition-colors flex items-center gap-1.5"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 7v10c0 1.1.9 2 2 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H6a2 2 0 00-2 2z"
                                />
                            </svg>
                            Datasets
                        </a>
                    )}
                </header>

                <ul className="flex flex-col gap-3 lg:gap-6 bg-slate-100 px-4 md:px-8 lg:px-10 py-4 md:py-6 lg:py-9 rounded-t-xl lg:rounded-t-3xl grow overflow-y-auto">
                    {factories.map((factoryItem, index) => (
                        <li
                            key={factoryItem.slug}
                            data-scenario={index === 0 ? "corrective-maintenance-step-1" : undefined}
                        >
                            <FactoryItem factoryItem={factoryItem} stoppage={stoppages.get(factoryItem.scene_id)} />
                            {factoryItem.enabled && (
                                <div data-scenario="tour-guide-1" className="bg-slate-50 -mt-2 pt-5 p-3 rounded-b-md">
                                    <ManufacturingOrderPlanning
                                        siteId={factoryItem.scene_id}
                                        onActiveStoppage={makeStoppageHandler(factoryItem.scene_id)}
                                    />
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
            <ScenarioStepper />
        </div>
    );
}
