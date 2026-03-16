//------------------------------------------------------------------------------
import { FactoryTile } from "@/components/nodes/factory/FactoryTile";
import { FactoriesContext } from "@/contexts/FactoriesContext";
import { useContext } from "react";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export default function HomePage() {
    //--------------------------------------------------------------------------
    // Context
    const { factories } = useContext(FactoriesContext);

    //--------------------------------------------------------------------------
    // Render
    return (
        <div className="h-dvh bg-linear-to-br from-slate-50 to-slate-100 overflow-x-hidden">
            <div className="container flex flex-col h-full mx-auto pb-16">
                <header className="flex items-start gap-4 max-w-6xl py-10">
                    <span
                        role="img"
                        className="block w-8 aspect-square rounded-full bg-linear-to-tr from-accent-200 to-accent-500 shadow-[0_4px_16px_-8px_var(--color-accent)]"
                    />
                    <div>
                        <h1 className="text-xl font-bold mb-2">[Client Name]</h1>
                        <p className="text-sm text-subtle/80">[Client Description]</p>
                    </div>
                </header>

                <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 grow">
                    {factories.map((factoryItem) => (
                        <li key={factoryItem.slug}>
                            <FactoryTile factoryItem={factoryItem} />
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
