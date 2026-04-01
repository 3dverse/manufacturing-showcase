import { useMemo } from "react";
import { BoundingBoxFaceProjection } from "@3dverse/livelink-react-ui";

//------------------------------------------------------------------------------
import { useNavNode } from "@/components/navigation/hooks";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { NavGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
export const FloorOutline = ({ node }: { node: NavGraphNode }) => {
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
            return { boxShadow: "inset 0 0 0 2px rgba(56, 189, 248, 0.95)" };
        }
        if (isHovered) {
            return { boxShadow: "inset 0 0 0 1px rgba(56, 189, 248, 0.65)" };
        }
        return undefined;
    }, [isSelected, isHovered]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <BoundingBoxFaceProjection entity={node.entity} face="bottom">
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
