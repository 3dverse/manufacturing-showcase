import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import { NODE_WIDTH } from "./content";
import type { BOMFlowData, BOMNodeData } from "./type";

//------------------------------------------------------------------------------
const BOM_NODE_STYLES: Record<BOMNodeData["itemType"], string> = {
    raw_material: "bg-slate-50  border-slate-300 text-slate-700",
    wip: "bg-blue-50   border-blue-300  text-blue-800",
    finished_good: "bg-positive-50 border-positive-400 text-positive-800",
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export function BOMNode({ data }: NodeProps<Node<BOMFlowData>>) {
    return (
        <div
            className={cn(
                "rounded-lg border shadow-sm px-3 py-2 text-xs cursor-pointer transition-shadow",
                data.isSelected
                    ? "ring-2 ring-accent-500 ring-offset-1 shadow-md"
                    : data.isHovered
                      ? "shadow-md ring-2 ring-offset-1 ring-slate-400"
                      : "hover:shadow-md hover:ring-2 hover:ring-offset-1 hover:ring-slate-400",
                BOM_NODE_STYLES[data.itemType],
            )}
            style={{ width: NODE_WIDTH }}
        >
            <Handle type="target" position={Position.Left} style={{ background: "#94a3b8" }} />
            <div className="font-mono font-semibold truncate">{data.itemId}</div>
            <div className="opacity-50 capitalize mt-0.5">{data.itemType.replace(/_/g, " ")}</div>
            {data.operationCode && (
                <div className="mt-1 opacity-70 truncate">
                    {data.operationCode}
                    {data.operationType && (
                        <span className="ml-1 opacity-60">· {data.operationType.replace(/_/g, " ")}</span>
                    )}
                </div>
            )}
            <Handle type="source" position={Position.Right} style={{ background: "#94a3b8" }} />
        </div>
    );
}
