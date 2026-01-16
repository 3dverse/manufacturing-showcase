//------------------------------------------------------------------------------
import { useContext } from "react";
import {
  Livelink,
  Canvas,
  Viewport,
  CameraController,
  useCameraEntity,
  LivelinkContext,
} from "@3dverse/livelink-react";
import { LoadingOverlay } from "@3dverse/livelink-react-ui";

//------------------------------------------------------------------------------
import logo from "./assets/3dverse-wordmark.svg";
import "./App.css";

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
  const { cameraEntity } = useCameraEntity();
  const { isConnecting } = useContext(LivelinkContext);

  return (
    <Canvas className="h-dvh">
      <Viewport cameraEntity={cameraEntity} className="w-full h-full">
        {!isConnecting && (
            <div className='absolute bottom-3 left-1/2 -translate-x-1/2 bg-green-800 text-sm text-white rounded-full py-1 px-3 pointer-events-none animate-[fade-out_.5s_2s_forwards]'>
                Connected.
            </div>
        )}
        
        <CameraController />
      </Viewport>
    </Canvas>
  );
}

export default App;
