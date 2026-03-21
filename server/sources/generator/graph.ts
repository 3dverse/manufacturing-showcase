import type {
    AreaNode,
    CellNode,
    FactoryNode,
    LineNode,
    MachineNode,
} from "../operations/dataset/generateDataset";

export function flattenCells(factory: FactoryNode): CellNode[] {
    const cells: CellNode[] = [];
    for (const area of factory.areas) {
        for (const cell of area.cells) cells.push(cell);
        for (const line of area.lines) {
            for (const cell of line.cells) cells.push(cell);
        }
    }
    return cells;
}

export function flattenMachines(factory: FactoryNode): MachineNode[] {
    return flattenCells(factory).flatMap((c) => c.machines);
}

export function flattenAreas(factory: FactoryNode): AreaNode[] {
    return factory.areas;
}

export function getCellsByOperationType(factory: FactoryNode, operationType: string): CellNode[] {
    return flattenCells(factory).filter((c) => c.tags["operationType"] === operationType);
}

export function getAreaForCell(factory: FactoryNode, cellName: string): AreaNode | undefined {
    for (const area of factory.areas) {
        for (const cell of area.cells) {
            if (cell.name === cellName) return area;
        }
        for (const line of area.lines) {
            for (const cell of line.cells) {
                if (cell.name === cellName) return area;
            }
        }
    }
    return undefined;
}

export function getLineForCell(factory: FactoryNode, cellName: string): LineNode | undefined {
    for (const area of factory.areas) {
        for (const line of area.lines) {
            for (const cell of line.cells) {
                if (cell.name === cellName) return line;
            }
        }
    }
    return undefined;
}

export function getMachinesForCell(factory: FactoryNode, cellName: string): MachineNode[] {
    for (const cell of flattenCells(factory)) {
        if (cell.name === cellName) return cell.machines;
    }
    return [];
}
