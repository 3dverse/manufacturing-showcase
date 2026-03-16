//------------------------------------------------------------------------------
import { useContext, useEffect } from "react";
import { LivelinkContext } from "@3dverse/livelink-react";
import type { Entity } from "@3dverse/livelink";
import { SelectionContext } from "@/contexts/SelectionContext";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const ViewerController = ({
    pickedEntity,
    hoveredEntity,
}: {
    pickedEntity: { entity: Entity } | null;
    hoveredEntity: { entity: Entity } | null;
}) => {
    //--------------------------------------------------------------------------
    // Contexts
    const { instance } = useContext(LivelinkContext);
    const { setSelectedNodeByEntity } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    // Hover feedback
    useEffect(() => {
        console.log("hoveredEntity", hoveredEntity);
    }, [hoveredEntity]);

    //--------------------------------------------------------------------------
    // Effects
    useEffect(() => {
        if (!pickedEntity) return;

        instance?.scene.highlightEntities({
            entities: pickedEntity ? [pickedEntity.entity] : [],
        });

        if (isArea(pickedEntity?.entity)) {
            setSelectedNodeByEntity(pickedEntity.entity);
        } else {
            setSelectedNodeByEntity(undefined);
        }
    }, [instance?.scene, pickedEntity, setSelectedNodeByEntity]);

    //--------------------------------------------------------------------------
    return null;
};

//------------------------------------------------------------------------------
const isArea = (entity: Entity) => {
    return entity.parent?.name.startsWith("area:");
};
