import { useContext, useRef } from "react";
import {
    Canvas,
    Viewport,
    CameraController,
    useCameraEntity,
    LivelinkContext,
    DefaultCameraController,
} from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import MainNav from "@/components/layout/MainNav";
import StationLabels from "@/components/stations/StationLabels";

//------------------------------------------------------------------------------
const ViewerLayout = ({ currentRoute }: { currentRoute: string }) => {
    //--------------------------------------------------------------------------
    console.log("currentRoute", currentRoute);

    //--------------------------------------------------------------------------
    const cameraControllerRef = useRef<DefaultCameraController | null>(null);
    const { cameraEntity } = useCameraEntity({ position: [10, 10, -10] });
    const { isConnecting } = useContext(LivelinkContext);

    //--------------------------------------------------------------------------
    return (
        <div className="relative flex-1">
            <Canvas className="w-full h-full filter-[ brightness(1.2)]">
                <Viewport cameraEntity={cameraEntity} className="w-full h-full">
                    {!isConnecting && (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-green-800 text-sm text-white rounded-full py-1 px-3 pointer-events-none animate-[fade-out_.5s_2s_forwards]">
                            Connected.
                        </div>
                    )}
                    <CameraController ref={cameraControllerRef} />
                    <StationLabels cameraController={cameraControllerRef.current} />
                </Viewport>
                {/* Light overlay */}
                {/* <span className="absolute top-0 left-0 w-full h-full bg-linear-to-b from-accent to-transparent mix-blend-multiply pointer-events-none opacity-80" /> */}
            </Canvas>

            <div className="absolute bottom-0 left-0 w-full h-full flex p-2 pointer-events-none">
                <MainNav />
            </div>
        </div>
    );
};

export default ViewerLayout;
