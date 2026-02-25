import { useContext, useEffect, useRef, useState } from "react";
import type { Entity, Quat } from "@3dverse/livelink";
import {
    Canvas,
    Viewport,
    CameraController,
    useCameraEntity,
    LivelinkContext,
    DOM3DOverlay,
} from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import StationLabels from "@/components/stations/StationLabels";
import { ViewerController } from "@/components/viewer/ViewerController";
import FactoryBuilder from "@/components/viewer/FactoryBuilder";
import { DebugOverlay } from "@/components/viewer/overlays/DebugOverlay";

//------------------------------------------------------------------------------
import { CameraContext } from "@/contexts/CameraContext";
import { SelectionContext } from "@/contexts/SelectionContext";
import { moveCamera } from "@/utils/camera-v2";
import { FactoryContext } from "@/contexts/FactoryContext";
import { NodeTypes } from "@/content/enums";

//------------------------------------------------------------------------------
const Viewer = () => {
    //--------------------------------------------------------------------------
    // Contexts
    const { isConnecting } = useContext(LivelinkContext);
    const { selectedNode, setSelectedNode } = useContext(SelectionContext);
    const { nodeGraph } = useContext(FactoryContext);
    const { viewportRef, setCameraEntity, cameraControllerRef } = useContext(CameraContext);

    //--------------------------------------------------------------------------
    // State
    const [hoveredEntity, setHoveredEntity] = useState<{ entity: Entity } | null>(null);
    const [pickedEntity, setPickedEntity] = useState<{ entity: Entity } | null>(null);

    //--------------------------------------------------------------------------
    // Refs
    const viewerInitialized = useRef<boolean>(false);

    //--------------------------------------------------------------------------
    // Hooks
    const { cameraEntity } = useCameraEntity({
        position: [1000, 1000, -1000],
        orientation: [-0.70710678, 0, 0, 0.70710678],
    });

    //--------------------------------------------------------------------------
    // Effects
    useEffect(() => {
        if (selectedNode && cameraControllerRef.current && viewportRef.current && cameraEntity) {
            let orientation: Quat = [
                -0.44003356996275617, 0.05388425132186897, 0.026463849189241398, 0.8959724378860116,
            ];
            switch (selectedNode.type) {
                case NodeTypes.area:
                    orientation = [-0.37752972036564136, 0.1714462240290261, 0.07134813040666622, 0.9071862800959365];
                    break;
                case NodeTypes.cell:
                    orientation = [-0.16281971476827492, 0.30383855316504915, 0.052784601893145586, 0.9372223108186922];
                    break;
                case NodeTypes.machine:
                    orientation = [-0.010867751372844726, 0.3934001860658572, 0.004650729594915339, 0.9192913337444676];
                    break;
            }
            moveCamera(
                selectedNode?.entity,
                cameraControllerRef.current,
                viewportRef.current,
                cameraEntity,
                orientation,
            );
        }
    }, [selectedNode, cameraControllerRef, viewportRef, cameraEntity]);

    //--------------------------------------------------------------------------
    useEffect(() => {
        setCameraEntity(cameraEntity);
    }, [setCameraEntity, cameraEntity]);

    //--------------------------------------------------------------------------
    useEffect(() => {
        // Initialize the view
        function check() {
            if (
                !viewerInitialized.current &&
                nodeGraph &&
                cameraControllerRef.current &&
                viewportRef.current &&
                cameraEntity
            ) {
                viewerInitialized.current = true;
                setSelectedNode(nodeGraph);
            } else {
                setTimeout(check, 200);
            }
        }
        check();
    }, [setSelectedNode, viewerInitialized, nodeGraph, cameraControllerRef, viewportRef, cameraEntity]);

    //--------------------------------------------------------------------------
    return (
        <Canvas className="w-full h-full filter-[ brightness(1.2)]">
            <Viewport
                ref={viewportRef}
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
                {false && <DebugOverlay />}
            </Viewport>
            {/* Light overlay */}
            {/* <span className="absolute top-0 left-0 w-full h-full bg-linear-to-b from-accent to-transparent mix-blend-multiply pointer-events-none opacity-80" /> */}
        </Canvas>
    );
};

export default Viewer;
