import { ViewerPanel } from "@/components/common/ViewerPanel";
import Button from "@/components/common/Button";

//------------------------------------------------------------------------------
const MainGuidance = () => {
    const handleContact = () => {
        window.open("https://www.3dverse.com/get-in-touch", "_blank", "noopener,noreferrer");
    };

    return (
        <ViewerPanel
            data-theme="dark"
            className="relative w-full h-24 text-default bg-ground shadow-[0_-4px_32px_-1px_rgba(0,0,0,0.1)] z-50"
        >
            <div className="flex items-center justify-between h-full px-10">
                <div className="flex flex-col">
                    <p className="text-lg  font-semibold">3dverse</p>
                    <p className="text-sm text-muted hidden sm:inline">Immersive 3D Experiences</p>
                </div>

                <div className="flex-1 flex justify-center">
                    <h2 className="text-lg tracking-wide font-medium">Manufacturing Demo</h2>
                </div>

                <div>
                    <Button onClick={handleContact} variant="ghost" size="xs">
                        Contact 3dverse
                    </Button>
                </div>
            </div>
        </ViewerPanel>
    );
};

export default MainGuidance;
