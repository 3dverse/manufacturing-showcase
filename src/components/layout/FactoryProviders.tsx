//------------------------------------------------------------------------------
import { type ReactNode } from "react";

//------------------------------------------------------------------------------
import { FactoryContextProvider } from "@/components/contextProviders/FactoryContextProvider";
import { SelectionContextProvider } from "@/components/contextProviders/SelectionContextProvider";
import { HoverContextProvider } from "../contextProviders/HoverContextProvider";
import { ScenarioFocusResolver } from "@/components/scenarios/ScenarioFocusResolver";

//------------------------------------------------------------------------------
import type { Factory } from "@/content/type";

//------------------------------------------------------------------------------
export const FactoryProviders = ({ factory, children }: { factory: Factory; children: ReactNode }) => {
    return (
        <FactoryContextProvider factory={factory}>
            <SelectionContextProvider>
                <HoverContextProvider>
                    <ScenarioFocusResolver />
                    {children}
                </HoverContextProvider>
            </SelectionContextProvider>
        </FactoryContextProvider>
    );
};
