import { useContext, useEffect, useRef } from "react";
import { LivelinkContext } from "@3dverse/livelink-react";
import type { Entity, Vec3 } from "@3dverse/livelink";
import { useSelectedContext } from "@/contexts/SelectedContext";

//------------------------------------------------------------------------------
const AREA_DEFAULT_COLOR = [0, 1, 0.25882352941176473] as Vec3;
const LINE_DEFAULT_COLOR = [0, 0.5176470588235295, 1] as Vec3;
// const CELL_DEFAULT_COLOR = [0, 1, 0.7725490196078432] as Vec3;
const HOVER_COLOR = [1, 1, 1] as Vec3;

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
    const { setSelected } = useSelectedContext();
    const hoveredLineRef = useRef<Entity | null>(null);
    const hoveredAreaRef = useRef<Entity | null>(null);

    //--------------------------------------------------------------------------
    useEffect(() => {
        document.body.style.cursor = hoveredEntity ? "pointer" : "default";

        console.log("hoveredEntity", hoveredEntity?.entity.parent?.name);
        if (!hoveredEntity) return;

        // Highlight Area
        if (isArea(hoveredEntity.entity)) {
            hoveredAreaRef.current = hoveredEntity.entity;
            hoveredEntity.entity.material!.dataJSON.albedo = HOVER_COLOR;
        } else {
            if (hoveredAreaRef.current) {
                hoveredAreaRef.current.material!.dataJSON.albedo = AREA_DEFAULT_COLOR;
            }
        }

        // Highlight Line
        if (isLine(hoveredEntity.entity)) {
            hoveredLineRef.current = hoveredEntity.entity;
            hoveredEntity.entity.material!.dataJSON.albedo = HOVER_COLOR;
        } else {
            if (hoveredLineRef.current) {
                hoveredLineRef.current.material!.dataJSON.albedo = LINE_DEFAULT_COLOR;
            }
        }

        return () => {
            if (hoveredAreaRef.current) {
                hoveredAreaRef.current.material!.dataJSON.albedo = AREA_DEFAULT_COLOR;
            }
            if (hoveredLineRef.current) {
                hoveredLineRef.current.material!.dataJSON.albedo = LINE_DEFAULT_COLOR;
            }
        };
    }, [hoveredEntity]);

    //--------------------------------------------------------------------------
    useEffect(() => {
        if (!pickedEntity) return;

        instance?.scene.highlightEntities({
            entities: pickedEntity ? [pickedEntity.entity] : [],
        });

        if (isArea(pickedEntity?.entity)) {
            console.log("pickedEntity", pickedEntity?.entity.parent.name);
            setSelected({ kind: "area", id: pickedEntity.entity.parent!.name, entity: pickedEntity?.entity });
        } else {
            setSelected(null);
        }
    }, [instance?.scene, pickedEntity, setSelected]);

    //--------------------------------------------------------------------------
    return null;
};

//------------------------------------------------------------------------------
const isArea = (entity: Entity) => {
    return entity.parent?.name.startsWith("area:");
};
//------------------------------------------------------------------------------
const isLine = (entity: Entity) => {
    return entity.parent?.name.startsWith("line:");
};
//------------------------------------------------------------------------------
const isCell = (entity: Entity) => {
    return entity.parent?.name.startsWith("cell:");
};
//------------------------------------------------------------------------------
const isMachine = (entity: Entity) => {
    return entity.parent?.name.startsWith("machine:");
};
//------------------------------------------------------------------------------
