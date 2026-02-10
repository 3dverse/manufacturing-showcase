//------------------------------------------------------------------------------
import { Livelink } from "@3dverse/livelink-react";
import { LoadingOverlay } from "@3dverse/livelink-react-ui";

//------------------------------------------------------------------------------
import { useState } from "react";
import ViewerLayout from "@/components/layout/ViewerLayout";
import MainGuidance from "@/components/guidance/MainGuidance";
import Theme from "@/components/pages/Theme";
import IntroductionModal from "@/components/guidance/IntroductionModal";

//------------------------------------------------------------------------------
const scene_id = "d490dde6-5590-426f-a0ff-7a422b3e2ba7";
const token = "public_OJTstp3bLFmUw0OS";

//------------------------------------------------------------------------------
export function App() {
    return (
        <Livelink sceneId={scene_id} token={token} LoadingPanel={LoadingOverlay}>
            <AppLayout />
        </Livelink>
    );
}

//------------------------------------------------------------------------------
function AppLayout() {
    const [currentRoute, setCurrentRoute] = useState("/");
    const [isIntroductionModalOpen, setIsIntroductionModalOpen] = useState<boolean>(false);

    return (
        <div className="flex flex-col h-dvh">
            {currentRoute === "/theme" ? (
                <Theme onBack={() => setCurrentRoute("/")} />
            ) : (
                <>
                    <ViewerLayout currentRoute={currentRoute} setCurrentRoute={setCurrentRoute} />
                    <MainGuidance />
                </>
            )}
            <IntroductionModal isOpen={isIntroductionModalOpen} onClose={() => setIsIntroductionModalOpen(false)} />
        </div>
    );
}

export default App;
