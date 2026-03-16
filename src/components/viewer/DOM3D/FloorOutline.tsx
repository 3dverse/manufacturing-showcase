import { useMemo } from "react";
import { BoundingBoxFaceProjection } from "@3dverse/livelink-react-ui";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { FactoryGraphNode } from "@/content/type";
import { useNavNode } from "@/components/navigation/hooks";

//------------------------------------------------------------------------------
export const FloorOutline = ({ node }: { node: FactoryGraphNode }) => {
    //--------------------------------------------------------------------------
    // Hooks
    const { pointerDownHandler, clickHandler, mouseEnterHandler, mouseLeaveHandler, isSelected, isHovered } =
        useNavNode(node, "dom3d");

    //--------------------------------------------------------------------------
    // Memos
    const stateClassName = useMemo(() => {
        const classNames = [isSelected ? "pointer-events-none border-3 outline-80" : "cursor-pointer bg-accent-500/05"];
        if (!isSelected && isHovered)
            classNames.push("bg-accent-500/10 outline-80 outline-accent-500/20 border-accent");
        return cn(...classNames);
    }, [isSelected, isHovered]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <BoundingBoxFaceProjection entity={node.entity} face="bottom">
            <div
                className={cn(
                    "w-full h-full rounded-xl border-3 border-accent/80 outline-accent-500/0 outline-40 transition-all duration-200 pointer-events-auto",
                    stateClassName,
                )}
                onPointerDown={pointerDownHandler}
                onClick={clickHandler}
                onMouseEnter={mouseEnterHandler}
                onMouseLeave={mouseLeaveHandler}
            ></div>
        </BoundingBoxFaceProjection>
    );
};
