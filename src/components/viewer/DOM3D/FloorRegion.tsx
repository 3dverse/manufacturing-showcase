//------------------------------------------------------------------------------
import { useMemo } from "react";
import { BoundingBoxFaceProjection } from "@3dverse/livelink-react-ui";

//------------------------------------------------------------------------------
import { useNavNode } from "@/components/navigation/hooks";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { FactoryGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const FloorRegion = ({ node }: { node: FactoryGraphNode }) => {
    //--------------------------------------------------------------------------
    // Hooks
    const { clickHandler, mouseEnterHandler, mouseLeaveHandler, isSelected, isHovered } = useNavNode(node, "dom3d");

    //--------------------------------------------------------------------------
    // Memos
    const stateClassName = useMemo(() => {
        const classNames = [isSelected ? "pointer-events-none" : "cursor-pointer"];
        if (!isSelected && isHovered) classNames.push("bg-slate-0/20");
        return cn(...classNames);
    }, [isSelected, isHovered]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <BoundingBoxFaceProjection entity={node.entity} face="bottom">
            <div
                className={cn("w-full h-full rounded-xl transition-colors duration-200", stateClassName)}
                onClick={clickHandler}
                onMouseEnter={mouseEnterHandler}
                onMouseLeave={mouseLeaveHandler}
            />
        </BoundingBoxFaceProjection>
    );
};
