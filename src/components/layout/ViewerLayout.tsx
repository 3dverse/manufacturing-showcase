import { useContext, useRef, useState } from "react";
import type { Entity } from "@3dverse/livelink";
import {
    Canvas,
    Viewport,
    CameraController,
    useCameraEntity,
    LivelinkContext,
    DefaultCameraController,
} from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import StationLabels from "@/components/stations/StationLabels";
import { ViewerController } from "@/components/viewer/ViewerController";

//------------------------------------------------------------------------------
const ViewerLayout = ({ currentRoute }: { currentRoute: string }) => {
    //--------------------------------------------------------------------------
    console.log("currentRoute", currentRoute);

    //--------------------------------------------------------------------------
    const cameraControllerRef = useRef<DefaultCameraController | null>(null);
    const { cameraEntity } = useCameraEntity({ position: [10, 10, -10] });
    const { isConnecting } = useContext(LivelinkContext);

    //--------------------------------------------------------------------------
    const [pickedEntity, setPickedEntity] = useState<{ entity: Entity } | null>(null);
    const [hoveredEntity, setHoveredEntity] = useState<{ entity: Entity } | null>(null);

    //--------------------------------------------------------------------------
    return (
        <div className="relative flex-1">
            <Canvas className="w-full h-full filter-[ brightness(1.2)]">
                <Viewport
                    cameraEntity={cameraEntity}
                    className="w-full h-full"
                    setHoveredEntity={setHoveredEntity}
                    setPickedEntity={setPickedEntity}
                >
                    {!isConnecting && (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-green-800 text-sm text-white rounded-full py-1 px-3 pointer-events-none animate-[fade-out_.5s_2s_forwards]">
                            Connected.
                        </div>
                    )}
                    <ViewerController hoveredEntity={hoveredEntity} pickedEntity={pickedEntity} />
                    <CameraController ref={cameraControllerRef} />
                    <StationLabels cameraController={cameraControllerRef.current} />
                </Viewport>
                {/* Light overlay */}
                {/* <span className="absolute top-0 left-0 w-full h-full bg-linear-to-b from-slate-100 to-transparent mix-blend-multiply pointer-events-none opacity-80" /> */}
            </Canvas>

            <div className="absolute bottom-0 left-0 w-full h-full flex pointer-events-none">{/* Content */}</div>
        </div>
    );
};

export default ViewerLayout;
