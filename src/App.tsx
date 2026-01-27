//------------------------------------------------------------------------------
import { Livelink } from "@3dverse/livelink-react";
import { LoadingOverlay } from "@3dverse/livelink-react-ui";

//------------------------------------------------------------------------------
import { useState } from "react";
import ViewerLayout from "@/components/layout/ViewerLayout";
import MainGuidance from "@/components/guidance/MainGuidance";
import Theme from "@/components/pages/Theme";

//------------------------------------------------------------------------------
const scene_id = "85854d95-3263-46eb-b83f-736380f59417";
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
        </div>
    );
}

export default App;
