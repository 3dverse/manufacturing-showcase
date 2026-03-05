//------------------------------------------------------------------------------
import { type ReactNode } from "react";

//------------------------------------------------------------------------------
import { CameraContextProvider } from "@/components/contextProviders/CameraContextProvider";
import { FactoryContextProvider } from "@/components/contextProviders/FactoryContextProvider";
import { SelectionContextProvider } from "@/components/contextProviders/SelectionContextProvider";
import { HoverContextProvider } from "../contextProviders/HoverContextProvider";

//------------------------------------------------------------------------------
import type { Factory } from "@/content/factory";

//------------------------------------------------------------------------------
export const FactoryProviders = ({ factory, children }: { factory: Factory; children: ReactNode }) => {
    return (
        <CameraContextProvider>
            <FactoryContextProvider factory={factory}>
                <SelectionContextProvider>
                    <HoverContextProvider>{children}</HoverContextProvider>
                </SelectionContextProvider>
            </FactoryContextProvider>
        </CameraContextProvider>
    );
};
