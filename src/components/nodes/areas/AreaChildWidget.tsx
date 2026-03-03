//------------------------------------------------------------------------------
import { QuadLayout } from "@/utils/QuadLayout";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { CellNode, LineNode } from "@/content/type";
import { NodeTypes } from "@/content/enums";

//------------------------------------------------------------------------------
export function AreaChildWidget({
    node,
    isSelected = false,
    onMouseEnter,
    onMouseLeave,
    onMouseMoveCapture,
    onClick,
}: {
    node: CellNode | LineNode;
    isSelected?: boolean;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onMouseMoveCapture?: (e: React.MouseEvent<HTMLDivElement>) => void;
    onClick?: () => void;
}) {
    return (
        <>
            <QuadLayout
                entity={node.entity}
                face="bottom"
                center={
                    <div
                        className={cn(
                            "w-full h-full rounded-xl transition-colors duration-200",
                            isSelected ? "border-8 border-accent-500" : "hover:bg-slate-0/20 cursor-pointer",
                        )}
                        onClick={onClick}
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                        onMouseMoveCapture={onMouseMoveCapture}
                    />
                }
            />
            <QuadLayout
                entity={node.entity}
                face="right"
                containerClassName="flex items-end"
                center={
                    <div
                        className={cn(
                            "w-full h-full min-h-32 p-2 border-2 rounded-xl border-slate-0 transition-colors duration-200",
                            isSelected ? "opacity-0" : "hover:bg-slate-0/20 hover:border-accent cursor-pointer",
                        )}
                        onClick={onClick}
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                        onMouseMoveCapture={onMouseMoveCapture}
                    >
                        <p className="px-3 py-1 w-fit text-slate-800 text-base capitalize bg-slate-0/50 border border-slate-0/50 rounded-lg backdrop-blur-sm">
                            {node.name} {node.type === NodeTypes.line ? "LINE" : "CELL"}
                        </p>
                    </div>
                }
            />
        </>
    );
}
