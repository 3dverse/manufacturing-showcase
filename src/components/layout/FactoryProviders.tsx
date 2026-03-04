//------------------------------------------------------------------------------
import { type ReactNode } from "react";

//------------------------------------------------------------------------------
import { CameraContextProvider } from "@/components/contextProviders/CameraContextProvider";
import { FactoryContextProvider } from "@/components/contextProviders/FactoryContextProvider";
import { SelectionContextProvider } from "@/components/contextProviders/SelectionContextProvider";
import { HoverContextProvider } from "../contextProviders/HoverContextProvider";

//------------------------------------------------------------------------------
export const FactoryProviders = ({ children }: { children: ReactNode }) => {
    return (
        <CameraContextProvider>
            <FactoryContextProvider>
                <SelectionContextProvider>
                    <HoverContextProvider>{children}</HoverContextProvider>
                </SelectionContextProvider>
            </FactoryContextProvider>
        </CameraContextProvider>
    );
};
