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
const scene_id = "b294481f-c9e7-4d4c-89ee-0fe178588cdc";
const token = "public_fv9rmOeoPWO1-xpX";

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
        <div className="absolute bottom-0 right-0 p-2 sm:p-4 w-full sm:max-w-2xs sm:min-w-md">
            <div className="flex flex-col items-center sm:items-start gap-8 sm:gap-4 py-12 sm:py-5 px-6 bg-black/70 text-white rounded-md backdrop-blur-xl shadow-xl">
                <a href="https://docs.3dverse.com" target="_blank">
                    <img src={logo} className="h-4" alt="3dverse logo" />
                </a>
                <ol className="list-inside list-decimal flex flex-col gap-1 text-md/6 text-center sm:text-left tracking-wide">
                    <li>Get started by editing <code className="text-sm ml-1 text-white/60">src/App.tsx</code></li>
                    <li>
                        <a href="https://docs.3dverse.com/references/livelink.react" target="_blank" className="hover:text-yellow-400">
                            Read The Livelink React Docs
                        </a>
                    </li>
                </ol>
                <div className="flex gap-2">
                    <a href="https://discord.com/invite/Ax53gQS3Pu" target="_blank" className="text-sm text-white/60 hover:text-yellow-400">Discord</a>
                    <a href="https://3dverse.com" target="_blank" className="text-sm text-white/60 hover:text-yellow-400">3dverse.com</a>
                </div>
            </div>
        </div>
        <CameraController />
      </Viewport>
    </Canvas>
  );
}

export default App;
