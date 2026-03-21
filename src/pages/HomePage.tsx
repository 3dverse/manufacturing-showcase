import { useContext, useEffect } from "react";

//------------------------------------------------------------------------------
import { FactoriesContext } from "@/contexts/FactoriesContext";

//------------------------------------------------------------------------------
import { FactoryItem } from "@/components/nodes/factory/FactoryItem";
import { MES } from "@/core/APIs";
import { DATASET } from "@/core/APIs";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export default function HomePage() {
    //--------------------------------------------------------------------------
    // Contexts
    const { factories } = useContext(FactoriesContext);

    //--------------------------------------------------------------------------
    useEffect(() => {
        // TODO: remove just and example
        MES.getOperation({ operationId: "asd" }).then((resp) => {
            console.log(resp);
        });
        DATASET.generateDataset().then(() => {
            console.log("generated");
        });
    }, []);

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
