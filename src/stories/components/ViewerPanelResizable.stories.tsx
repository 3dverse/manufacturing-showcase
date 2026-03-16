//------------------------------------------------------------------------------
import { useRef, useState } from "react";
import type { Meta } from "@storybook/react-vite";
import type { Entity } from "@3dverse/livelink";
import { LoadingOverlay } from "@3dverse/livelink-react-ui";
import {
    CameraController,
    Canvas,
    DefaultCameraController,
    Livelink,
    useCameraEntity,
    Viewport,
} from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import { ViewerPanelResizable } from "@/components/common/ViewerPanelResizable";
import { ViewerController } from "@/components/viewer/ViewerController";
import { factories } from "@/content/stories/factory";

//------------------------------------------------------------------------------
const meta = {
    title: "Components/ViewerPanelResizable",
    component: ViewerPanelResizable,
    parameters: {
        layout: "fullscreen",
    },
} satisfies Meta<typeof ViewerPanelResizable>;
export default meta;

//------------------------------------------------------------------------------
export const _ViewerPanelResizable = () => {
    return (
        <div className="w-screen h-screen bg-neutral-200">
            <LivelinkWrapper>
                <div className="absolute bottom-0 left-0 w-full h-full flex pointer-events-none">
                    <ViewerPanelResizable
                        resizableFrom="right"
                        defaultWidth={300}
                        minWidth={200}
                        maxWidth={800}
                        className="w-full h-full p-4 bg-underground pointer-events-auto"
                    >
                        ViewerPanelResizable
                    </ViewerPanelResizable>
                </div>
            </LivelinkWrapper>
        </div>
    );
};

//------------------------------------------------------------------------------
const scene_id = factories[0].scene_id;
const token = "public_OJTstp3bLFmUw0OS";

//------------------------------------------------------------------------------
const LivelinkWrapper = ({ children }: { children: React.ReactNode }) => {
    return (
        <Livelink sceneId={scene_id} token={token} LoadingPanel={LoadingOverlay}>
            <CanvasWrapper />
            {children}
        </Livelink>
    );
};

//------------------------------------------------------------------------------
const CanvasWrapper = () => {
    const { cameraEntity } = useCameraEntity({ position: [10, 10, -10] });
    const cameraControllerRef = useRef<DefaultCameraController | null>(null);

    const [pickedEntity, setPickedEntity] = useState<{ entity: Entity } | null>(null);
    const [hoveredEntity, setHoveredEntity] = useState<{ entity: Entity } | null>(null);

    // -------------------------------------------------------------------------
    // Toggle commented code to reproduce bug
    // -------------------------------------------------------------------------
    return (
        <Canvas className="w-full h-full">
            <Viewport
                cameraEntity={cameraEntity}
                className="w-full h-full"
                setHoveredEntity={setHoveredEntity}
                setPickedEntity={setPickedEntity}
            >
                <ViewerController hoveredEntity={hoveredEntity} pickedEntity={pickedEntity} />
                <CameraController ref={cameraControllerRef} />
            </Viewport>
        </Canvas>
    );
};
