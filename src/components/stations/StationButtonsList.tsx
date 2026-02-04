//------------------------------------------------------------------------------
import { type DefaultCameraController, useEntities } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import Button from "@/components/common/Button";
import { moveCamera } from "@/utils/camera";

//------------------------------------------------------------------------------
const StationButtonsList = ({ cameraController }: { cameraController: DefaultCameraController | null }) => {
    //--------------------------------------------------------------------------
    const { entities } = useEntities({ mandatory_components: ["label"] }, ["label"]);

    //--------------------------------------------------------------------------
    if (!cameraController || !entities.length) {
        return null;
    }
    //--------------------------------------------------------------------------
    return (
        <div className="flex gap-1 pointer-events-auto">
            {entities.map((entity) => (
                <Button key={entity.id} onClick={() => moveCamera(entity, cameraController)}>
                    {entity.label?.title || "Unnamed Label"}
                </Button>
            ))}
        </div>
    );
};

export default StationButtonsList;
