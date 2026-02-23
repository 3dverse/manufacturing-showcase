//------------------------------------------------------------------------------
import { useState, useEffect } from "react";
import { Livelink } from "@3dverse/livelink-react";
import { LoadingOverlay } from "@3dverse/livelink-react-ui";

//------------------------------------------------------------------------------
import Theme from "@/pages/Theme";
import HomePage from "@/pages/HomePage";
//------------------------------------------------------------------------------
import FactoryLayout from "@/components/layout/FactoryLayout";
import MainGuidance from "@/components/guidance/MainGuidance";
import IntroductionModal from "@/components/guidance/IntroductionModal";

//------------------------------------------------------------------------------
import { factories } from "@/content/factory";
import { TOKEN_3DVERSE } from "@/content/3dverse";
import { useFactoryStore } from "@/store/useFactoryStore";
import { useNavigationStore } from "@/store/useNavigationStore";

//------------------------------------------------------------------------------
export function App() {
    return <AppLayout />;
}

//------------------------------------------------------------------------------
function AppLayout() {
    //--------------------------------------------------------------------------
    const [currentRoute, setCurrentRoute] = useState(() => window.location.pathname);
    const [isIntroductionModalOpen, setIsIntroductionModalOpen] = useState<boolean>(false);
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
    // Update factory store when route changes
    useEffect(() => {
        if (currentRoute.startsWith("/factory/")) {
            const factoryId = currentRoute.split("/")[2];
            const factory = factories.find((f) => f.id === factoryId);
            if (factory) {
                setCurrentFactory(factory);
            } else {
                clearCurrentFactory();
            }
        } else {
            clearCurrentFactory();
        }
    }, [currentRoute, setCurrentFactory, clearCurrentFactory]);

    //--------------------------------------------------------------------------
    const renderContent = () => {
        if (currentRoute === "/") {
            return <HomePage />;
        } else if (currentRoute === "/theme") {
            return <Theme onBack={() => navigate("/")} />;
        } else if (currentRoute.startsWith("/factory/")) {
            const factoryId = currentRoute.split("/")[2];
            const factory = factories.find((f) => f.id === factoryId);

            if (!factory) {
                return <HomePage />;
            }
            return (
                <Livelink sceneId={factory.scene_id} token={TOKEN_3DVERSE} LoadingPanel={LoadingOverlay}>
                    <FactoryLayout currentRoute={currentRoute} />
                    {/* eslint-disable-next-line no-constant-binary-expression */}
                    {false && <MainGuidance />}
                </Livelink>
            );
        }
        return <HomePage />;
    };

    //--------------------------------------------------------------------------
    return (
        <div className="flex flex-col h-dvh">
            {renderContent()}
            <IntroductionModal isOpen={isIntroductionModalOpen} onClose={() => setIsIntroductionModalOpen(false)} />
        </div>
    );
}

export default App;
