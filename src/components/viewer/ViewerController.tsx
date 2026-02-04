import { useContext, useEffect } from "react";
import { LivelinkContext } from "@3dverse/livelink-react";
import type { Entity } from "@3dverse/livelink";

//------------------------------------------------------------------------------
export const ViewerController = ({
    hoveredEntity,
    pickedEntity,
}: {
    hoveredEntity: { entity: Entity } | null;
    pickedEntity: { entity: Entity } | null;
}) => {
    //--------------------------------------------------------------------------
    const { instance } = useContext(LivelinkContext);

    //--------------------------------------------------------------------------
    useEffect(() => {
        document.body.style.cursor = hoveredEntity ? "pointer" : "default";
    }, [hoveredEntity]);

    //--------------------------------------------------------------------------
    useEffect(() => {
        instance?.scene.highlightEntities({
            entities: pickedEntity ? [pickedEntity.entity] : [],
        });
    }, [instance?.scene, pickedEntity]);

    //--------------------------------------------------------------------------
    return null;
};
