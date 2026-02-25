//------------------------------------------------------------------------------
import { useContext, useEffect } from "react";
import { LivelinkContext } from "@3dverse/livelink-react";
import type { Entity } from "@3dverse/livelink";
import { SelectionContext } from "@/contexts/SelectionContext";

//------------------------------------------------------------------------------

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
    const { setSelectedNodeByEntity } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    // Hover feedback
    useEffect(() => {
        console.log("hoveredEntity", hoveredEntity);
    }, [hoveredEntity]);

    //--------------------------------------------------------------------------
    // Pick selection
    useEffect(() => {
        if (!pickedEntity) return;

        instance?.scene.highlightEntities({
            entities: pickedEntity ? [pickedEntity.entity] : [],
        });

        if (isArea(pickedEntity?.entity)) {
            setSelectedNodeByEntity(pickedEntity.entity);
        } else {
            setSelectedNodeByEntity(null);
        }
    }, [instance?.scene, pickedEntity, setSelectedNodeByEntity]);

    //--------------------------------------------------------------------------
    return null;
};

//------------------------------------------------------------------------------
const isArea = (entity: Entity) => {
    return entity.parent?.name.startsWith("area:");
};
