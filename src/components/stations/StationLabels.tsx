//------------------------------------------------------------------------------
import { DefaultCameraController, DOM3DOverlay, DOMEntity, useEntities } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import { moveCamera } from "@/utils/camera";

//------------------------------------------------------------------------------
const StationLabels = ({ cameraController }: { cameraController: DefaultCameraController }) => {
    //--------------------------------------------------------------------------
    const { entities } = useEntities({ mandatory_components: ["label"] }, ["label"]);

    //--------------------------------------------------------------------------
    return (
        <DOM3DOverlay>
            {entities.map((entity) => (
                <DOMEntity key={entity.id} entity={entity} anchor="center">
                    <div
                        className="px-3 py-1 text-xs text-primary-dark font-medium bg-white/60 border border-white/40 backdrop-blur-3xl rounded-full select-none cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => moveCamera(entity, cameraController)}
                        title={entity.label?.title || ""}
                    >
                        {entity.label?.title || ""}
                    </div>
                </DOMEntity>
            ))}
        </DOM3DOverlay>
    );
};

export default StationLabels;
