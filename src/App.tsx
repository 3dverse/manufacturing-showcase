//------------------------------------------------------------------------------
import { useState, useEffect } from "react";
import { Livelink } from "@3dverse/livelink-react";
import { LoadingOverlay } from "@3dverse/livelink-react-ui";

//------------------------------------------------------------------------------
import Theme from "@/pages/Theme";
import HomePage from "@/pages/HomePage";
//------------------------------------------------------------------------------
import ViewerLayout from "@/components/layout/ViewerLayout";
import MainGuidance from "@/components/guidance/MainGuidance";
import IntroductionModal from "@/components/guidance/IntroductionModal";

//------------------------------------------------------------------------------
import { factories } from "./content/factory";
import { useFactoryStore } from "@/store/useFactoryStore";

//------------------------------------------------------------------------------
const token = "public_OJTstp3bLFmUw0OS";

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

    //--------------------------------------------------------------------------
    // Navigation function that updates both state and URL
    const navigate = (route: string) => {
        setCurrentRoute(route);
        window.history.pushState(null, "", route);
    };

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
            const factoryId = currentRoute.replace("/factory/", "");
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
            return <HomePage onNavigate={navigate} />;
        } else if (currentRoute === "/theme") {
            return <Theme onBack={() => navigate("/")} />;
        } else if (currentRoute.startsWith("/factory/")) {
            const factoryId = currentRoute.replace("/factory/", "");
            const factory = factories.find((f) => f.id === factoryId);

            if (!factory) {
                return <HomePage onNavigate={navigate} />;
            }
            return (
                <Livelink sceneId={factory.scene_id} token={token} LoadingPanel={LoadingOverlay}>
                    <ViewerLayout currentRoute={currentRoute} setCurrentRoute={navigate} factory={factory} />
                    <MainGuidance />
                </Livelink>
            );
        }
        return <HomePage onNavigate={navigate} />;
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
