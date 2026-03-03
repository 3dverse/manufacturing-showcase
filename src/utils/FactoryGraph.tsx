import { NodeTypes } from "@/content/enums";
import type {
    FactoryNode,
    AreaNode,
    CellNode,
    FactoryGraphNode,
    LineNode,
    MachineNode,
    FlowInNode,
    FlowOutNode,
    FlowSplinePoint,
} from "@/content/type";
import type { Entity } from "@3dverse/livelink";

//------------------------------------------------------------------------------
export function buildFactoryGraph(params: { entities: Entity[]; area_categories_sort: string[] }): {
    graph?: FactoryNode;
    list: FactoryGraphNode[];
} {
    const { entities, area_categories_sort } = params;
    const factories: Entity[] = [];
    const areas: Entity[] = [];
    const lines: Entity[] = [];
    const cells: Entity[] = [];
    const machines: Entity[] = [];
    const flowIns: Entity[] = [];
    const flowOuts: Entity[] = [];

    for (const e of entities) {
        const name = e.name.toLowerCase();
        if (!name.includes(":")) continue;

        const parts = name.split(":");
        const [type] = parts;

        switch (type) {
            case "factory":
                factories.push(e);
                break;
            case "area":
                areas.push(e);
                break;
            case "line":
                lines.push(e);
                break;
            case "cell":
                cells.push(e);
                break;
            case "machine":
                machines.push(e);
                break;
            case "flow-in":
                flowIns.push(e);
                break;
            case "flow-out":
                flowOuts.push(e);
                break;
        }
    }

    const list: FactoryGraphNode[] = [];

    const factoryNodes: FactoryNode[] = factories.map((factoryEntity) => {
        const factory: FactoryNode = {
            entity: factoryEntity,
            euid: factoryEntity.euid.value,
            type: NodeTypes.factory,
            name: parseName(factoryEntity),
            areas: [],
        };

        list.push(factory);

        const areaNodes: AreaNode[] = areas
            .filter((a) => inLineage(a, factory.euid))
            .map((areaEntity) => {
                const area: AreaNode = {
                    entity: areaEntity,
                    euid: areaEntity.euid.value,
                    type: NodeTypes.area,
                    name: parseName(areaEntity),
                    parent: factory,
                    lines: [],
                    cells: [],
                    flows: { ins: [], outs: [], pairs: [] },
                };
                list.push(area);

                const lineNodes: LineNode[] = lines
                    .filter((l) => inLineage(l, area.euid))
                    .map((lineEntity) => {
                        const line: LineNode = {
                            entity: lineEntity,
                            euid: lineEntity.euid.value,
                            type: NodeTypes.line,
                            name: parseName(lineEntity),
                            parent: area,
                        };
                        list.push(line);
                        return line;
                    });
                area.lines = lineNodes;

                const cellNodes: CellNode[] = cells
                    .filter((c) => inLineage(c, area.euid))
                    .map((cellEntity) => {
                        const cell: CellNode = {
                            entity: cellEntity,
                            euid: cellEntity.euid.value,
                            type: NodeTypes.cell,
                            name: parseName(cellEntity),
                            parent: area,
                            machines: [],
                        };

                        list.push(cell);

                        const machineNodes: MachineNode[] = machines
                            .filter((m) => inLineage(m, cell.euid))
                            .map((machineEntity) => {
                                const machine: MachineNode = {
                                    entity: machineEntity,
                                    euid: machineEntity.euid.value,
                                    type: NodeTypes.machine,
                                    name: parseName(machineEntity),
                                    parent: cell,
                                };
                                list.push(machine);
                                return machine;
                            });

                        cell.machines = machineNodes;
                        return cell;
                    });
                area.cells = cellNodes;

                const flowInNodes: FlowInNode[] = flowIns
                    .filter((f) => inLineage(f, area.euid))
                    .map((flowInEntity) => {
                        const flowIn: FlowInNode = {
                            entity: flowInEntity,
                            euid: flowInEntity.euid.value,
                            type: NodeTypes.flowIn,
                            name: parseName(flowInEntity),
                            parent: area,
                        };
                        list.push(flowIn);
                        return flowIn;
                    });

                const flowOutNodes: FlowOutNode[] = flowOuts
                    .filter((f) => inLineage(f, area.euid))
                    .map((flowOutEntity) => {
                        const flowOut: FlowOutNode = {
                            entity: flowOutEntity,
                            euid: flowOutEntity.euid.value,
                            type: NodeTypes.flowOut,
                            name: parseName(flowOutEntity),
                            parent: area,
                        };
                        list.push(flowOut);
                        return flowOut;
                    });
                area.flows = { ins: flowInNodes, outs: flowOutNodes, pairs: [] };

                return area;
            })
            .sort((a, b) => sortAreas(a, b, area_categories_sort));

        buildFlowPairsAcrossAreas(areaNodes);

        factory.areas = areaNodes;

        factory.areas[1].flows.pairs[0] = {
            in: factory.areas[1].flows.pairs[0].in,
            out: factory.areas[1].flows.pairs[0].out,
            spline: MOCK_SPLINE_1,
        };

        factory.areas[1].flows.pairs[1] = {
            in: factory.areas[1].flows.pairs[1].in,
            out: factory.areas[1].flows.pairs[1].out,
            spline: MOCK_SPLINE_2,
        };

        return factory;
    });
    const graph = factoryNodes.length > 0 ? factoryNodes[0] : undefined;
    return { graph, list };
}

//------------------------------------------------------------------------------
/** Pairs IN nodes with OUT nodes from a *different* area (same name). Each pair is attached to the area of the IN. */
function buildFlowPairsAcrossAreas(areaNodes: AreaNode[]): void {
    const key = (n: FlowInNode | FlowOutNode) => n.name.trim().toLowerCase();
    for (const area of areaNodes) {
        for (const flowIn of area.flows.ins) {
            const k = key(flowIn);
            const out = areaNodes
                .filter((a) => a.euid !== area.euid)
                .flatMap((a) => a.flows.outs)
                .find((o) => key(o) === k);
            if (out) {
                area.flows.pairs.push({ in: flowIn, out });
            }
        }
    }
}

//------------------------------------------------------------------------------
function parseName(entity: Entity): string {
    const parts = entity.name.split(":");
    return parts.length >= 2 ? parts[1] : entity.name;
}

//------------------------------------------------------------------------------
function inLineage(child: Entity, ancestorEuid: string): boolean {
    const lin = child.lineage?.value ?? "";
    return lin.includes(ancestorEuid);
}

//------------------------------------------------------------------------------
const sortAreas = (a: AreaNode, b: AreaNode, order: string[]) => {
    const indexOf = (category: string) => {
        const i = order.findIndex((s) => s.toLowerCase() === category.toLowerCase());
        return i === -1 ? Infinity : i;
    };
    return indexOf(a.name) - indexOf(b.name);
};

//------------------------------------------------------------------------------
const MOCK_SPLINE_1 = [
    {
        position: [9.13, 0, 32.64],
    },
    {
        position: [9, 0, 29.22],
    },
    {
        position: [10, 0.64, 25.11],
    },
    {
        position: [10.33, 0.64, 18.66],
    },
] as FlowSplinePoint[];

const MOCK_SPLINE_2 = [
    {
        position: [9, 0, 29.2],
    },
    {
        position: [7.76, 0.6, 25],
    },
    {
        position: [7.61, 0.6, 18.4],
    },
] as FlowSplinePoint[];
