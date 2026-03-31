//------------------------------------------------------------------------------
import { createContext } from "react";

//------------------------------------------------------------------------------
export type FooterTab = "timeline" | "bom";

//------------------------------------------------------------------------------
type FooterTabsContextType = {
    footerTab: FooterTab;
    setFooterTab: (tab: FooterTab) => void;
};

//------------------------------------------------------------------------------
export const FooterTabsContext = createContext<FooterTabsContextType>(
    new Proxy({} as FooterTabsContextType, {
        get() {
            throw new Error("FooterTabsContext must be used within a FooterTabsContextProvider");
        },
    }),
);
