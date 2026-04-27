import { useContext } from "react";

//------------------------------------------------------------------------------
import { FactoriesContext } from "@/contexts/FactoriesContext";

//------------------------------------------------------------------------------
import { FactoryItem } from "@/components/nodes/factory/FactoryItem";
import { ManufacturingOrderPlanning } from "@/components/manufacturingOrders/ManufacturingOrderPlanning";
import { ScenarioStepper } from "@/components/scenarios/ScenarioStepper";

//------------------------------------------------------------------------------
import { DevMode } from "@/content/3dverse";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export default function HomePage() {
    //--------------------------------------------------------------------------
    const { factories } = useContext(FactoriesContext);

    //--------------------------------------------------------------------------
    // Render
    return (
        <div className="flex flex-col min-h-dvh bg-linear-to-br from-slate-50 to-slate-100 overflow-x-hidden">
            <div className="container flex flex-col grow mx-auto">
                <header className="relative flex items-start gap-4 py-4 md:py-8 lg:py-10 px-4 2xl:px-0">
                    <span
                        role="img"
                        className="block w-8 aspect-square rounded-full bg-linear-to-tr from-accent-200 to-accent-500 shadow-[0_4px_16px_-8px_var(--color-accent)]"
                    />
                    <div>
                        <h1 className="text-xl font-bold mb-2">PPL Industry</h1>
                    </div>
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
                        <li key={factoryItem.slug} data-scenario={index === 0 && "incident-step-1"}>
                            <FactoryItem factoryItem={factoryItem} />
                            {factoryItem.enabled && (
                                <div className="bg-slate-50 -mt-2 pt-5 p-3 rounded-b-md">
                                    <ManufacturingOrderPlanning />
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
