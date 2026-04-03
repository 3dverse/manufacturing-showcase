import { useContext } from "react";

//------------------------------------------------------------------------------
import { FactoryContext } from "@/contexts/FactoryContext";
import { SelectionContext } from "@/contexts/SelectionContext";

//------------------------------------------------------------------------------
/**
 * Resolves a node hash to its display name and renders it as a clickable link
 * that navigates to the node. Falls back to a truncated hash if not found.
 */
export function NodeLink({ hash }: { hash: string | null | undefined }) {
    const { nodeList } = useContext(FactoryContext);
    const { setSelectedNode } = useContext(SelectionContext);

    if (!hash) return <span className="text-muted/50">—</span>;

    const node = nodeList.find((n) => n.hash === hash);

    if (!node) {
        return <span className="font-mono text-muted/70">{hash.slice(0, 8)}</span>;
    }

    return (
        <button
            className="text-xs text-blue-400 hover:text-blue-300 hover:underline underline-offset-2 transition-colors text-right"
            onClick={() => setSelectedNode(node)}
        >
            {node.name}
        </button>
    );
}
