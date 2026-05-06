import { useContext, useMemo } from "react";

import { FactoryContext } from "@/contexts/FactoryContext";
import { SelectionContext } from "@/contexts/SelectionContext";
import { isBin } from "@/core/SceneGraph";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export function NodeButton({ nodeId, className }: { nodeId: string | null | undefined; className?: string }) {
    //--------------------------------------------------------------------------
    // Context
    const { nodeList } = useContext(FactoryContext);
    const { setSelectedNode } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    // Memos
    const node = useMemo(() => (nodeId ? (nodeList.find((n) => n.hash === nodeId) ?? null) : null), [nodeList, nodeId]);
    const label = useMemo(() => (node ? (isBin(node) ? `bin-${node.hash}` : node?.name) : undefined), [node]);

    //--------------------------------------------------------------------------
    // Render
    if (!nodeId) return null;
    if (!node) return <span className="text-xs">{nodeId}</span>;

    return (
        <button
            onClick={() => setSelectedNode(node)}
            title={node.hash}
            className={className ?? "text-xs text-accent hover:underline cursor-pointer font-medium"}
        >
            {label}
        </button>
    );
}
