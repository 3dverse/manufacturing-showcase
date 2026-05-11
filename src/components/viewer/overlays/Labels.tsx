//------------------------------------------------------------------------------
import { DefaultCameraController, DOMEntity, useEntities } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import { getDefaultOrientationForNodeType, moveCamera } from "@/utils/camera";
import { useCallback, useContext } from "react";
import { LivelinkExfilContext } from "@/contexts/LivelinkExfilContext";
import type { Entity } from "@3dverse/livelink";
import { NodeTypes } from "@/content/enums";

//------------------------------------------------------------------------------
export const Labels = ({ cameraController }: { cameraController: DefaultCameraController | null }) => {
    //--------------------------------------------------------------------------
    // Hooks
    const { entities } = useEntities({ mandatory_components: ["label"] }, ["label"]);
    const { viewportRef, cameraEntity } = useContext(LivelinkExfilContext);

    //--------------------------------------------------------------------------
    const clickHandler = useCallback(
        (entity: Entity) => {
            if (!cameraController) {
                return null;
            }
            const viewport = viewportRef?.current;
            if (cameraController && viewport && cameraEntity) {
                moveCamera(
                    entity,
                    cameraController,
                    viewport,
                    cameraEntity,
                    getDefaultOrientationForNodeType(NodeTypes.machine),
                );
            }
        },
        [viewportRef, cameraController, cameraEntity],
    );

    //--------------------------------------------------------------------------
    return entities.map((entity) => (
        <DOMEntity key={entity.id} entity={entity} anchor="center">
            <div
                className="px-3 py-1 text-xs text-primary-dark font-medium bg-white/60 border border-white/40 backdrop-blur-3xl rounded-full select-none cursor-pointer hover:scale-105 transition-transform"
                onClick={() => clickHandler(entity)}
                title={entity.label?.title || ""}
            >
                {entity.label?.title || ""}
            </div>
        </DOMEntity>
    ));
};
