import { useMemo } from "react";
import { BoundingBoxFaceProjection } from "@3dverse/livelink-react-ui";

//------------------------------------------------------------------------------
import { useNavNode } from "@/components/navigation/hooks";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { SceneGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
export const FloorOutline = ({ node }: { node: SceneGraphNode }) => {
    //--------------------------------------------------------------------------
    // Hooks
    const { pointerDownHandler, clickHandler, mouseEnterHandler, mouseLeaveHandler, isSelected, isHovered } =
        useNavNode(node, "dom3d");

    // Memos
    const stateClassName = useMemo(() => {
        const classNames = [isSelected ? "pointer-events-none" : "cursor-pointer bg-accent-500/05"];
        if (!isSelected && isHovered) {
            classNames.push("bg-accent-500/10");
        }
        return cn(...classNames);
    }, [isSelected, isHovered]);

    //--------------------------------------------------------------------------
    const stateStyle = useMemo(() => {
        if (isSelected) {
            return { boxShadow: "inset 0 0 0 2px var(--color-accent-300)" };
        }
        if (isHovered) {
            return { boxShadow: "inset 0 0 0 8px var(--color-accent-300)" };
        }
        return undefined;
    }, [isSelected, isHovered]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <BoundingBoxFaceProjection entity={node.entity} face="bottom" scale={48}>
            <div
                className={cn("w-full h-full transition-colors duration-200 pointer-events-auto", stateClassName)}
                style={stateStyle}
                onPointerDown={pointerDownHandler}
                onClick={clickHandler}
                onMouseEnter={mouseEnterHandler}
                onMouseLeave={mouseLeaveHandler}
            ></div>
        </BoundingBoxFaceProjection>
    );
};
