import type { FactoryNode, CellNode } from "@/content/type";

export function allCells(nodeGraph: FactoryNode): CellNode[] {
    const cells: CellNode[] = [];
    for (const area of nodeGraph.areas) {
        cells.push(...area.cells);
        for (const line of area.lines) cells.push(...line.cells);
    }
    return cells;
}

export function cellByMachineHash(nodeGraph: FactoryNode, machineHash: string): CellNode | null {
    return allCells(nodeGraph).find((c) => c.machines.some((m) => m.hash === machineHash)) ?? null;
}
