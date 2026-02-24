//------------------------------------------------------------------------------
import { useContext, useEffect } from "react";
import { LivelinkContext } from "@3dverse/livelink-react";
import type { Entity } from "@3dverse/livelink";

//------------------------------------------------------------------------------
import { useSelectedContext } from "@/contexts/SelectedContext";

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
    const { setSelectedElementById } = useSelectedContext();

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
            setSelectedElementById(pickedEntity.entity.parent!.name);
        } else {
            setSelectedElementById(null);
        }
    }, [instance?.scene, pickedEntity, setSelectedElementById]);

    //--------------------------------------------------------------------------
    return null;
};

//------------------------------------------------------------------------------
const isArea = (entity: Entity) => {
    return entity.parent?.name.startsWith("area:");
};
