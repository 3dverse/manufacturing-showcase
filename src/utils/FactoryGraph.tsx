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
export const buildFactoryGraph = (params: {
    entities: Entity[];
}): {
    graph?: FactoryNode;
    list: FactoryGraphNode[];
} => {
    const { entities } = params;
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

    //--------------------------------------------------------------------------
    const mapFactoryEntity = (factoryEntity: Entity) => {
        const factory: FactoryNode = {
            entity: factoryEntity,
            euid: factoryEntity.euid.value,
            type: NodeTypes.factory,
            name: parseName(factoryEntity),
            areas: [],
        };

        factory.areas = areas.map((e) => mapAreaEntity(e, factory));

        list.push(factory);
        return factory;
    };

    //--------------------------------------------------------------------------
    const mapAreaEntity = (areaEntity: Entity, parent: FactoryNode) => {
        const area: AreaNode = {
            entity: areaEntity,
            euid: areaEntity.euid.value,
            type: NodeTypes.area,
            name: parseName(areaEntity),
            parent,
            lines: [],
            cells: [],
            flows: { ins: [], outs: [], pairs: [] },
        };

        area.lines = lines.filter((l) => inLineage(l, area.euid)).map((e) => mapLineEntity(e, area));

        area.cells = cells
            .filter((c) => inLineage(c, area.euid) && area.lines.every((l) => !inLineage(c, l.euid)))
            .map((e) => mapCellEntity(e, area));

        area.flows = {
            ins: flowIns.filter((f) => inLineage(f, area.euid)).map((e) => mapFlowInEntity(e, area)),
            outs: flowOuts.filter((f) => inLineage(f, area.euid)).map((e) => mapFlowOutEntity(e, area)),
            pairs: [],
        };

        list.push(area);
        return area;
    };

    //--------------------------------------------------------------------------
    const mapLineEntity = (lineEntity: Entity, parent: AreaNode) => {
        const line: LineNode = {
            entity: lineEntity,
            euid: lineEntity.euid.value,
            type: NodeTypes.line,
            name: parseName(lineEntity),
            parent,
            cells: [],
        };

        line.cells = cells.filter((c) => inLineage(c, lineEntity.euid.value)).map((e) => mapCellEntity(e, parent));

        list.push(line);
        return line;
    };

    //--------------------------------------------------------------------------
    const mapCellEntity = (cellEntity: Entity, parent: AreaNode) => {
        const cell: CellNode = {
            entity: cellEntity,
            euid: cellEntity.euid.value,
            type: NodeTypes.cell,
            name: parseName(cellEntity),
            parent,
            machines: [],
        };
        cell.machines = machines.filter((m) => inLineage(m, cell.euid)).map((e) => mapMachineEntity(e, cell));
        list.push(cell);
        return cell;
    };

    //--------------------------------------------------------------------------
    const mapMachineEntity = (machineEntity: Entity, parent: CellNode) => {
        const machine: MachineNode = {
            entity: machineEntity,
            euid: machineEntity.euid.value,
            type: NodeTypes.machine,
            name: parseName(machineEntity),
            parent,
        };
        list.push(machine);
        return machine;
    };

    //--------------------------------------------------------------------------
    const mapFlowInEntity = (flowInEntity: Entity, parent: AreaNode) => {
        const flowIn: FlowInNode = {
            entity: flowInEntity,
            euid: flowInEntity.euid.value,
            type: NodeTypes.flowIn,
            name: parseName(flowInEntity),
            parent,
        };
        list.push(flowIn);
        return flowIn;
    };

    //--------------------------------------------------------------------------
    const mapFlowOutEntity = (flowOutEntity: Entity, parent: AreaNode) => {
        const flowOut: FlowOutNode = {
            entity: flowOutEntity,
            euid: flowOutEntity.euid.value,
            type: NodeTypes.flowOut,
            name: parseName(flowOutEntity),
            parent,
        };

        list.push(flowOut);
        return flowOut;
    };

    //--------------------------------------------------------------------------
    const factoryNodes: FactoryNode[] = factories.map((factoryEntity) => {
        const factory: FactoryNode = mapFactoryEntity(factoryEntity);

        buildFlowPairsAcrossAreas(factory.areas);

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

        console.log(factory);

        return factory;
    });

    const graph = factoryNodes.length > 0 ? factoryNodes[0] : undefined;
    return { graph, list };
};

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
export const sortAreas = (a: AreaNode, b: AreaNode, order: string[]) => {
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
