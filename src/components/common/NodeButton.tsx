import { useContext, useMemo } from "react";

import { FactoryContext } from "@/contexts/FactoryContext";
import { SelectionContext } from "@/contexts/SelectionContext";
import { isBin } from "@/core/SceneGraph";

type Props = {
    nodeId: string | null | undefined;
    className?: string;
};

export function NodeButton({ nodeId, className }: Props) {
    const { nodeList } = useContext(FactoryContext);
    const { setSelectedNode } = useContext(SelectionContext);

    const node = useMemo(() => (nodeId ? (nodeList.find((n) => n.hash === nodeId) ?? null) : null), [nodeList, nodeId]);

    if (!nodeId) return null;
    if (!node) return <span className="text-xs">{nodeId}</span>;

    const label = isBin(node) ? `bin-${node.hash}` : node.name;

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
