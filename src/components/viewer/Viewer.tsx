import { useContext, useEffect, useRef, useState } from "react";
import type { Entity } from "@3dverse/livelink";
import {
    Canvas,
    Viewport,
    CameraController,
    useCameraEntity,
    LivelinkContext,
    DefaultCameraController,
    DOM3DOverlay,
} from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import StationLabels from "@/components/stations/StationLabels";
import { ViewerController } from "@/components/viewer/ViewerController";
import FactoryBuilder from "@/components/viewer/FactoryBuilder";

//------------------------------------------------------------------------------
import { useSelectedContext } from "@/contexts/SelectedContext";

//------------------------------------------------------------------------------
const Viewer = () => {
    //--------------------------------------------------------------------------
    const cameraControllerRef = useRef<DefaultCameraController | null>(null);
    const { cameraEntity } = useCameraEntity({
        position: [10, 10, -10],
    });
    const { isConnecting } = useContext(LivelinkContext);
    const { selectedElement } = useSelectedContext();

    //--------------------------------------------------------------------------
    const [hoveredEntity, setHoveredEntity] = useState<{ entity: Entity } | null>(null);
    const [pickedEntity, setPickedEntity] = useState<{ entity: Entity } | null>(null);

    //--------------------------------------------------------------------------
    useEffect(() => {
        if (selectedElement && cameraControllerRef.current) {
            cameraControllerRef.current.setPosition(...selectedElement.entity.global_aabb.max, true);
            // cameraControllerRef.current?.fitToBox(selectedElement.entity.global_aabb, true);
        }
    }, [selectedElement]);

    //--------------------------------------------------------------------------
    return (
        <Canvas className="w-full h-full filter-[ brightness(1.2)]">
            <Viewport
                cameraEntity={cameraEntity}
                className="w-full h-full"
                setHoveredEntity={setHoveredEntity}
                setPickedEntity={setPickedEntity}
            >
                {!isConnecting && (
                    <div className="absolute top-3 right-3 bg-green-500 text-xs text-white rounded-full py-1 px-3 pointer-events-none animate-[fade-out_.5s_2s_forwards]">
                        Connected
                    </div>
                )}
                {/* eslint-disable-next-line no-constant-binary-expression */}
                {false && <ViewerController hoveredEntity={hoveredEntity} pickedEntity={pickedEntity} />}
                <CameraController ref={cameraControllerRef} />
                <StationLabels cameraController={cameraControllerRef.current} />
                <DOM3DOverlay>
                    <FactoryBuilder />
                </DOM3DOverlay>
            </Viewport>
            {/* Light overlay */}
            {/* <span className="absolute top-0 left-0 w-full h-full bg-linear-to-b from-accent to-transparent mix-blend-multiply pointer-events-none opacity-80" /> */}
        </Canvas>
    );
};

export default Viewer;
