import { useContext, useEffect, useRef } from "react";
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
    const hoveredLineRef = useRef<Entity | null>(null);
    const hoveredAreaRef = useRef<Entity | null>(null);

    //--------------------------------------------------------------------------
    useEffect(() => {
        document.body.style.cursor = hoveredEntity ? "pointer" : "default";

        console.log("hoveredEntity", hoveredEntity?.entity.parent?.name);
        if (!hoveredEntity) return;

        // Highlight Area
        if (hoveredEntity?.entity.parent?.name.startsWith("area:")) {
            hoveredAreaRef.current = hoveredEntity.entity;
            hoveredEntity.entity.material!.dataJSON.albedo = [1, 1, 1];
        } else {
            if (hoveredAreaRef.current) {
                hoveredAreaRef.current.material!.dataJSON.albedo = [0, 0, 0];
            }
        }

        // Highlight Line
        if (hoveredEntity?.entity.parent?.name.startsWith("line:")) {
            hoveredLineRef.current = hoveredEntity.entity;
            hoveredEntity.entity.material!.dataJSON.albedo = [1, 1, 1];
        } else {
            if (hoveredLineRef.current) {
                hoveredLineRef.current.material!.dataJSON.albedo = [0, 0, 0];
            }
        }

        return () => {
            if (hoveredAreaRef.current) {
                hoveredAreaRef.current.material!.dataJSON.albedo = [0, 0, 0];
            }
            if (hoveredLineRef.current) {
                hoveredLineRef.current.material!.dataJSON.albedo = [0, 0, 0];
            }
        };
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
