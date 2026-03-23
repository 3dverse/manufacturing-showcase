import { useContext } from "react";

//------------------------------------------------------------------------------
import { FactoriesContext } from "@/contexts/FactoriesContext";

//------------------------------------------------------------------------------
import { FactoryItem } from "@/components/nodes/factory/FactoryItem";
import { useNavigate } from "@/hooks/useNavigate";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export default function HomePage() {
    //--------------------------------------------------------------------------
    const { factories } = useContext(FactoriesContext);
    const navigate = useNavigate();

    //--------------------------------------------------------------------------
    // Render
    return (
        <div className="h-dvh bg-linear-to-br from-slate-50 to-slate-100 overflow-x-hidden">
            <div className="container px-4 flex flex-col h-full mx-auto pb-16">
                <header className="flex items-start gap-4 max-w-6xl py-10">
                    <span
                        role="img"
                        className="block w-8 aspect-square rounded-full bg-linear-to-tr from-accent-200 to-accent-500 shadow-[0_4px_16px_-8px_var(--color-accent)]"
                    />
                    <div>
                        <h1 className="text-xl font-bold mb-2">PPL Industry</h1>
                        {/* <p className="text-sm text-subtle/80">[Client Description]</p> */}
                    </div>
                    <button
                        onClick={() => navigate("/dataset")}
                        className="text-xs text-subtle hover:text-default transition-colors flex items-center gap-1.5 mt-1"
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
                    </button>
                </header>

                <ul className="grid grid-cols-1 gap-6">
                    {factories.map((factoryItem) => (
                        <li key={factoryItem.slug}>
                            <FactoryItem factoryItem={factoryItem} />
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
