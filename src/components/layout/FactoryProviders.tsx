//------------------------------------------------------------------------------
import { type ReactNode } from "react";

//------------------------------------------------------------------------------
import { FactoryContextProvider } from "@/components/contextProviders/FactoryContextProvider";
import { SelectionContextProvider } from "@/components/contextProviders/SelectionContextProvider";
import { CameraContextProvider } from "@/components/contextProviders/CameraContextProvider";

//------------------------------------------------------------------------------
export const FactoryProviders = ({ children }: { children: ReactNode }) => {
    return (
        <CameraContextProvider>
            <FactoryContextProvider>
                <SelectionContextProvider>{children}</SelectionContextProvider>
            </FactoryContextProvider>
        </CameraContextProvider>
    );
};
