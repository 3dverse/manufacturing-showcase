//------------------------------------------------------------------------------
import type { Entity, Vec3 } from "@3dverse/livelink";

//------------------------------------------------------------------------------
import { NodeTypes } from "@/content/enums";
import type {
    FactoryNode,
    AreaNode,
    CellNode,
    FactoryGraphNode,
    LineNode,
    MachineNode,
    FlowNode,
} from "@/content/type";

//------------------------------------------------------------------------------
export const buildFactoryGraph = async (params: {
    entities: Entity[];
}): Promise<{
    graph?: FactoryNode;
    list: FactoryGraphNode[];
}> => {
    const { entities } = params;
    const factories: Entity[] = [];
    const areas: Entity[] = [];
    const lines: Entity[] = [];
    const cells: Entity[] = [];
    const machines: Entity[] = [];
    const flows: Entity[] = [];

    for (const e of [...entities]) {
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
            case "flow":
                flows.push(e);
                break;
        }
    }

    // Resolve flow children
    const flowChildrenByEuid = new Map<
        string,
        [entityInEUID: string | undefined, entityOutEUID: string | undefined, paths: Vec3[], machineEntities: Entity[]]
    >();
    await Promise.all(
        flows.map(async (f) => {
            const children = await f.getChildren();
            const joinEntity = children.find((c) => c.joint);
            const entityInEUID = joinEntity ? joinEntity.joint?.constrainee.originalEUID : undefined;
            const entityOutEUID = joinEntity ? joinEntity.joint?.constrainer.originalEUID : undefined;
            // Get the first spline entity
            const splineEntities = children.filter((c) => c.spline)[0];
            const paths = await splineEntities
                .getChildren()
                .then((entity) =>
                    entity
                        .sort((a, b) => a.lineage!.ordinal - b.lineage!.ordinal)
                        .map((e) => e.global_transform.position),
                );
            const machineEntities = children.filter((c) => c.scene_ref);
            flowChildrenByEuid.set(f.euid.value, [entityInEUID, entityOutEUID, paths, machineEntities]);
        }),
    );

    const list: FactoryGraphNode[] = [];

    //--------------------------------------------------------------------------
    const mapFactoryEntity = (factoryEntity: Entity) => {
        const factory: FactoryNode = {
            entity: factoryEntity,
            euid: factoryEntity.euid.value,
            type: NodeTypes.factory,
            name: parseName(factoryEntity),
            areas: [],
            flows: [],
        };

        factory.areas = areas.map((e) => mapAreaEntity(e, factory)).sort(sortNode);

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
        };

        area.lines = lines
            .filter((l) => inLineage(l, area.euid))
            .map((e) => mapLineEntity(e, area))
            .sort(sortNode);

        area.cells = cells
            .filter((c) => inLineage(c, area.euid) && area.lines.every((l) => !inLineage(c, l.euid)))
            .map((e) => mapCellEntity(e, area))
            .sort(sortNode);

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

        line.cells = cells
            .filter((c) => inLineage(c, lineEntity.euid.value))
            .map((e) => mapCellEntity(e, line))
            .sort(sortNode);

        list.push(line);
        return line;
    };

    //--------------------------------------------------------------------------
    const mapCellEntity = (cellEntity: Entity, parent: AreaNode | LineNode) => {
        const cell: CellNode = {
            entity: cellEntity,
            euid: cellEntity.euid.value,
            type: NodeTypes.cell,
            name: parseName(cellEntity),
            parent,
            machines: [],
        };
        cell.machines = machines
            .filter((m) => inLineage(m, cell.euid))
            .map((e) => mapMachineEntity(e, cell))
            .sort(sortNode);
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
    const mapFactoryFlows = (flows: Entity[]) => {
        return flows.map((flowEntity) =>
            mapFlowEntity(
                flowEntity,
                flowChildrenByEuid.get(flowEntity.euid.value) as [
                    string | undefined,
                    string | undefined,
                    Vec3[],
                    Entity[],
                ],
            ),
        );
    };

    //--------------------------------------------------------------------------
    const mapFlowEntity = (
        flowEntity: Entity,
        [entityInEUID, entityOutEUID, paths, machineEntities]: [
            string | undefined,
            string | undefined,
            Vec3[],
            Entity[],
        ],
    ) => {
        const flow: FlowNode = {
            entity: flowEntity,
            euid: flowEntity.euid.value,
            type: NodeTypes.flow,
            name: parseName(flowEntity),
            entityInEUID: entityInEUID ?? "",
            entityOutEUID: entityOutEUID ?? "",
            paths: paths,
            machines: machineEntities,
        };
        return flow;
    };

    //--------------------------------------------------------------------------
    const factoryNodes: FactoryNode[] = factories.map((factoryEntity) => {
        const factory: FactoryNode = mapFactoryEntity(factoryEntity);
        factory.flows = mapFactoryFlows(flows);

        console.log(factory);
        return factory;
    });

    const graph = factoryNodes.length > 0 ? factoryNodes[0] : undefined;
    return { graph, list };
};

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
export const sortNode = (a: FactoryGraphNode, b: FactoryGraphNode) => {
    if (!a.entity.lineage) return -1;
    if (!b.entity.lineage) return 1;
    return a.entity.lineage.ordinal - b.entity.lineage.ordinal;
};
