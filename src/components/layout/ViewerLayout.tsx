import { useContext } from "react";
import { Canvas, Viewport, CameraController, useCameraEntity, LivelinkContext } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import MainMenu from "@/components/layout/MainMenu";
import MainPanel from "@/components/layout/MainPanel";
import { ConnectedSystemsPanel } from "@/components/connectedSystems/ConnectedSystemsPanel";

//------------------------------------------------------------------------------
const ViewerLayout = ({
    currentRoute,
    setCurrentRoute,
}: {
    currentRoute: string;
    setCurrentRoute: (route: string) => void;
}) => {
    const { cameraEntity } = useCameraEntity();
    const { isConnecting } = useContext(LivelinkContext);

    return (
        <div className="relative flex-1">
            {/* eslint-disable-next-line no-constant-binary-expression */}
            {false && (
                <Canvas className="w-full h-full" style={{ filter: "brightness(3) contrast(1.8) hue-rotate(335deg)" }}>
                    <Viewport cameraEntity={cameraEntity} className="w-full h-full">
                        {!isConnecting && (
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-green-800 text-sm text-white rounded-full py-1 px-3 pointer-events-none animate-[fade-out_.5s_2s_forwards]">
                                Connected.
                            </div>
                        )}

                        <CameraController />
                    </Viewport>
                </Canvas>
            )}
            <div
                className="absolute inset-0 bg-cover bg-center w-full h-full opacity-100 backdrop-blur-xl pointer-events-none"
                style={{
                    backgroundImage: "url(/bg.webp)",
                }}
            />
            <div className="absolute bottom-0 left-0 w-full h-full flex pointer-events-none">
                <MainMenu currentRoute={currentRoute} setCurrentRoute={setCurrentRoute} />
                <MainPanel />
                <div className="p-4">
                    <ConnectedSystemsPanel />
                </div>
            </div>
        </div>
    );
};

export default ViewerLayout;
