import type { BOMNodeData } from "./type";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export function BOMDetails({ BOMNode, onDeselect }: { BOMNode: BOMNodeData; onDeselect?: () => void }) {
    return (
        <div className="mx-6 mb-4 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start gap-4">
            <div>
                <div className="text-muted uppercase tracking-wide mb-0.5">Item</div>
                <div className="font-mono font-semibold">{BOMNode.itemId}</div>
                <div className="text-muted capitalize">{BOMNode.itemType.replace(/_/g, " ")}</div>
            </div>
            {BOMNode.producedBy?.operationCode && (
                <div>
                    <div className="text-muted uppercase tracking-wide mb-0.5">Produced by</div>
                    <div className="font-semibold">{BOMNode.producedBy.operationCode}</div>
                    <div className="text-muted capitalize">{BOMNode.producedBy.operationType.replace(/_/g, " ")}</div>
                </div>
            )}
            {onDeselect && (
                <button onClick={onDeselect} className="ml-auto text-muted hover:text-default">
                    ✕
                </button>
            )}
        </div>
    );
}
