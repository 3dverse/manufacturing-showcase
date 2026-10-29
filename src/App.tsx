"use strict";
//------------------------------------------------------------------------------
import { useState, useEffect, useMemo } from "react";
import { listFolderAssets, setUserToken } from "@3dverse/api";

//------------------------------------------------------------------------------
import IntroductionModal from "@/components/scenarios/IntroductionModal";
import { MainGuidance } from "@/components/scenarios/MainGuidance";

//------------------------------------------------------------------------------
import HomePage from "@/pages/HomePage";
import FactoryPage from "@/pages/FactoryPage";
import DatasetPage from "@/pages/DatasetPage";
import ThemePage from "@/pages/ThemePage";
import SettingsPage from "@/pages/SettingsPage";

//------------------------------------------------------------------------------
import { useFactoryStore } from "@/store/useFactoryStore";
import { FactoriesContext } from "@/contexts/FactoriesContext";
import { ScenarioContextProvider } from "@/contexts/ScenariosContext";
import { Router } from "@/core/Router";

//------------------------------------------------------------------------------
import { LOCAL_STORAGE_KEYS, useLocalStorage } from "@/hooks/useLocalStorage";
import { formatSlug } from "@/core/Slug";
import { MEDIA_QUERIES, useMediaQuery } from "@/utils/useMediaQuery";

//------------------------------------------------------------------------------
import type { Factory } from "@/content/type";
import { DevMode, PUBLIC_FOLDER_ID, SCENE_WHITELIST, USER_TOKEN } from "./content/3dverse";
import { UserMode } from "./core/UserMode";

//------------------------------------------------------------------------------
setUserToken(USER_TOKEN);

//------------------------------------------------------------------------------
export function App() {
    return <AppLayout />;
}

let factoriesPromise: Promise<unknown>;

UserMode.init();

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
function AppLayout() {
    //--------------------------------------------------------------------------
    // State
    const [factories, setFactories] = useState<Factory[]>([]);
    const isMobile = useMediaQuery(MEDIA_QUERIES.MOBILE);

    //--------------------------------------------------------------------------
    const [currentRoute, setCurrentRoute] = useState(() => window.location.pathname);
    const [isIntroductionModalOpen, setIsIntroductionModalOpen] = useLocalStorage<boolean>(
        LOCAL_STORAGE_KEYS.IS_INTRODUCTION_MODAL_OPEN,
        true,
    );
    const { setCurrentFactory, clearCurrentFactory } = useFactoryStore();

    //--------------------------------------------------------------------------
    // Handle browser back/forward buttons
    useEffect(() => {
        const handlePopState = () => setCurrentRoute(window.location.pathname);
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    //--------------------------------------------------------------------------
    useEffect(() => {
        return Router.onChange(({ route }) => setCurrentRoute(route.pathname));
    }, []);

    //--------------------------------------------------------------------------
    useEffect(() => {
        if (factoriesPromise !== undefined) return;
        factoriesPromise = listFolderAssets({
            folder_id: PUBLIC_FOLDER_ID,
            offset: 0,
            limit: 10,
            filters: { asset_types: ["scene"] },
        }).then((resp) => {
            setFactories(
                resp.data.scenes
                    ?.map((d, index) => {
                        const slug = formatSlug(d.name);
                        const location = index % 2 === 0 ? "Paris, France" : "Tokyo, Japan";
                        const factory: Factory = {
                            slug,
                            name: d.name,
                            location,
                            description: "Lorem ipsm dolor sit amet consectetur adipisicing elit.",
                            scene_id: d.asset_id,
                            enabled: DevMode.active || SCENE_WHITELIST.includes(d.asset_id),
                            video: location === "Tokyo, Japan" ? "/assets/factory/factory_tokyo.webm" : undefined,
                        };
                        return factory;
                    })
                    .sort((f) => (f.enabled ? -1 : 1)) || [],
            );
        });
    }, []);

    //--------------------------------------------------------------------------
    // Update factory store when route changes
    useEffect(() => {
        const parts = currentRoute.split("/");
        if (parts.length >= 2 && parts[1] !== "") {
            const factorySlug = parts[1];
            const factory = factories.find((f) => f.slug === factorySlug);
            if (factory) {
                setCurrentFactory(factory);
            } else {
                clearCurrentFactory();
            }
        } else {
            clearCurrentFactory();
        }
    }, [factories, currentRoute, setCurrentFactory, clearCurrentFactory]);

    //--------------------------------------------------------------------------
    // Memos
    const content = useMemo(() => {
        if (!factories || factories.length == 0) return;
        const parts = currentRoute.split("/");
        if (parts.length >= 2 && parts[1] !== "") {
            const factorySlug = parts[1];
            const factory = factories.find((f) => f.slug === factorySlug);
            if (factory) {
                return <FactoryPage factory={factory} />;
            }
        }
        if (parts.length > 1) {
            switch (parts[1]) {
                case "theme":
                    return <ThemePage />;
                case "dataset":
                    return <DatasetPage />;
                case "settings":
                    return <SettingsPage />;
            }
        }
        return <HomePage />;
    }, [currentRoute, factories]);

    //--------------------------------------------------------------------------
    return (
        <FactoriesContext.Provider value={{ factories }}>
            <ScenarioContextProvider>
                {content}
                {!isMobile && <MainGuidance />}
                <IntroductionModal isOpen={isIntroductionModalOpen} onClose={() => setIsIntroductionModalOpen(false)} />
            </ScenarioContextProvider>
        </FactoriesContext.Provider>
    );
}

export default App;
