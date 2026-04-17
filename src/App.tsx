//------------------------------------------------------------------------------
import { useState, useEffect } from "react";

//------------------------------------------------------------------------------
import Theme from "@/pages/Theme";

//------------------------------------------------------------------------------
import { getFolderAssets, setUserToken } from "@3dverse/api";

//------------------------------------------------------------------------------
import IntroductionModal from "@/components/guidance/IntroductionModal";

//------------------------------------------------------------------------------
import { useFactoryStore } from "@/store/useFactoryStore";
import { useNavigationStore } from "@/store/useNavigationStore";
import { FactoriesContext } from "@/contexts/FactoriesContext";
import { UseCaseContextProvider } from "@/contexts/UseCaseContext";

//------------------------------------------------------------------------------
import { LOCAL_STORAGE_KEYS, useLocalStorage } from "@/hooks/useLocalStorage";
import { formatSlug } from "@/core/Slug";

//------------------------------------------------------------------------------

//------------------------------------------------------------------------------
import HomePage from "@/pages/HomePage";
import FactoryPage from "@/pages/FactoryPage";
import DatasetPage from "@/pages/DatasetPage";
import { MainGuidance } from "@/components/guidance/MainGuidance";

//------------------------------------------------------------------------------
import type { Factory } from "@/content/type";
import { DevMode, PUBLIC_FOLDER_ID, SCENE_WHITELIST, USER_TOKEN } from "./content/3dverse";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------

//------------------------------------------------------------------------------
setUserToken(USER_TOKEN);

//------------------------------------------------------------------------------
export function App() {
    return <AppLayout />;
}

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
function AppLayout() {
    //--------------------------------------------------------------------------
    // State
    const [factories, setFactories] = useState<Factory[]>([]);

    //--------------------------------------------------------------------------
    const [currentRoute, setCurrentRoute] = useState(() => window.location.pathname);
    const [isIntroductionModalOpen, setIsIntroductionModalOpen] = useLocalStorage<boolean>(
        LOCAL_STORAGE_KEYS.IS_INTRODUCTION_MODAL_OPEN,
        true,
    );
    const { setCurrentFactory, clearCurrentFactory } = useFactoryStore();
    const setNavigate = useNavigationStore((state) => state.setNavigate);
    //--------------------------------------------------------------------------
    // Navigation function that updates both state and URL
    const navigate = (route: string) => {
        setCurrentRoute(route);
        window.history.pushState(null, "", route);
    };

    //--------------------------------------------------------------------------
    // Register navigation function globally on mount
    useEffect(() => {
        setNavigate(navigate);
    }, [setNavigate]);

    //--------------------------------------------------------------------------
    // Handle browser back/forward buttons
    useEffect(() => {
        const handlePopState = () => {
            setCurrentRoute(window.location.pathname);
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    //--------------------------------------------------------------------------
    useEffect(() => {
        getFolderAssets({ folder_id: PUBLIC_FOLDER_ID, offset: 0, limit: 10, filter: { asset_type: "scene" } }).then(
            (resp) => {
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
            },
        );
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
    const renderContent = () => {
        if (currentRoute === "/theme") {
            return <Theme onBack={() => navigate("/")} />;
        }
        if (currentRoute === "/dataset") {
            return <DatasetPage />;
        }
        const parts = currentRoute.split("/");
        if (parts.length >= 2 && parts[1] !== "") {
            const factorySlug = parts[1];
            const factory = factories.find((f) => f.slug === factorySlug);
            if (factory) {
                return <FactoryPage factory={factory} />;
            } else {
                return <></>;
            }
        }
        return <HomePage />;
    };

    //--------------------------------------------------------------------------
    return (
        <FactoriesContext.Provider value={{ factories }}>
            <UseCaseContextProvider>
                {renderContent()}
                <MainGuidance />
                <IntroductionModal isOpen={isIntroductionModalOpen} onClose={() => setIsIntroductionModalOpen(false)} />
            </UseCaseContextProvider>
        </FactoriesContext.Provider>
    );
}

export default App;
