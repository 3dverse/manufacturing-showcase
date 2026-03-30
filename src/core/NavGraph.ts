//------------------------------------------------------------------------------
import type { Entity, Vec3 } from "@3dverse/livelink";

//------------------------------------------------------------------------------
import { NodeTypes } from "@/content/enums";
import type {
    FactoryNode,
    AreaNode,
    CellNode,
    NavGraphNode,
    LineNode,
    MachineNode,
    FlowNode,
    AisleNode,
    RackNode,
    BinNode,
} from "@/content/type";

//------------------------------------------------------------------------------
export const buildNavGraph = async (params: {
    entities: Entity[];
}): Promise<{
    graph: FactoryNode;
    list: NavGraphNode[];
}> => {
    const { entities } = params;
    const factories: Entity[] = [];
    const areas: Entity[] = [];
    const lines: Entity[] = [];
    const cells: Entity[] = [];
    const machines: Entity[] = [];
    const aisles: Entity[] = [];
    const racks: Entity[] = [];
    const bins: Entity[] = [];
    const flows: Entity[] = [];
    const out: Entity[] = [];

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
            case "aisle":
                aisles.push(e);
                break;
            case "rack":
                racks.push(e);
                break;
            case "bin":
                bins.push(e);
                break;
            case "flow":
                flows.push(e);
                break;
            case "out":
                out.push(e);
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

    const list: NavGraphNode[] = [];

    //--------------------------------------------------------------------------
    const mapFactoryEntity = (factoryEntity: Entity) => {
        const factory: FactoryNode = {
            hash: hashEntity(factoryEntity),
            entity: factoryEntity,
            type: NodeTypes.factory,
            name: parseName(factoryEntity),
            id: parseId(factoryEntity),
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
            hash: hashEntity(areaEntity),
            entity: areaEntity,
            type: NodeTypes.area,
            name: parseName(areaEntity),
            id: parseId(areaEntity),
            parent,
            lines: [],
            cells: [],
            aisles: [],
            racks: [],
        };

        area.lines = lines
            .filter((l) => inLineage(l, areaEntity.euid.value))
            .map((e) => mapLineEntity(e, area))
            .sort(sortNode);

        area.cells = cells
            .filter(
                (c) =>
                    inLineage(c, areaEntity.euid.value) && area.lines.every((l) => !inLineage(c, l.entity.euid.value)),
            )
            .map((e) => mapCellEntity(e, area))
            .sort(sortNode);
        area.aisles = aisles
            .filter((l) => inLineage(l, areaEntity.euid.value))
            .map((e) => mapAisleEntity(e, area))
            .sort(sortNode);

        area.racks = racks
            .filter(
                (c) =>
                    inLineage(c, areaEntity.euid.value) && area.aisles.every((l) => !inLineage(c, l.entity.euid.value)),
            )
            .map((e) => mapRackEntity(e, area))
            .sort(sortNode);
        return area;
    };

    //--------------------------------------------------------------------------
    const mapLineEntity = (lineEntity: Entity, parent: AreaNode) => {
        const line: LineNode = {
            hash: hashEntity(lineEntity),
            entity: lineEntity,
            type: NodeTypes.line,
            name: parseName(lineEntity),
            id: parseId(lineEntity),
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
            hash: hashEntity(cellEntity),
            entity: cellEntity,
            type: NodeTypes.cell,
            name: parseName(cellEntity),
            id: parseId(cellEntity),
            parent,
            machines: [],
            out: [],
        };
        cell.machines = machines
            .filter((m) => inLineage(m, cellEntity.euid.value))
            .map((e) => mapMachineEntity(e, cell))
            .sort(sortNode);
        cell.out = out.filter((o) => inLineage(o, cellEntity.euid.value));
        list.push(cell);
        return cell;
    };

    //--------------------------------------------------------------------------
    const mapMachineEntity = (machineEntity: Entity, parent: CellNode) => {
        const machine: MachineNode = {
            hash: hashEntity(machineEntity),
            entity: machineEntity,
            type: NodeTypes.machine,
            name: parseName(machineEntity),
            id: parseId(machineEntity),
            parent,
        };
        list.push(machine);
        return machine;
    };
    //--------------------------------------------------------------------------
    const mapAisleEntity = (aisleEntity: Entity, parent: AreaNode) => {
        const aisle: AisleNode = {
            hash: hashEntity(aisleEntity),
            entity: aisleEntity,
            type: NodeTypes.aisle,
            name: parseName(aisleEntity),
            id: parseId(aisleEntity),
            parent,
            racks: [],
        };

        aisle.racks = racks
            .filter((c) => inLineage(c, aisleEntity.euid.value))
            .map((e) => mapRackEntity(e, aisle))
            .sort(sortNode);

        list.push(aisle);
        return aisle;
    };

    //--------------------------------------------------------------------------
    const mapRackEntity = (rackEntity: Entity, parent: AreaNode | AisleNode) => {
        const rack: RackNode = {
            hash: hashEntity(rackEntity),
            entity: rackEntity,
            type: NodeTypes.rack,
            name: parseName(rackEntity),
            id: parseId(rackEntity),
            parent,
            bins: [],
        };
        rack.bins = bins
            .filter((m) => inLineage(m, rackEntity.euid.value))
            .map((e) => mapBinEntity(e, rack))
            .sort(sortNode);
        list.push(rack);
        return rack;
    };

    //--------------------------------------------------------------------------
    const mapBinEntity = (binEntity: Entity, parent: RackNode) => {
        const bin: BinNode = {
            hash: hashEntity(binEntity),
            entity: binEntity,
            type: NodeTypes.bin,
            name: parseName(binEntity),
            id: parseId(binEntity),
            parent,
        };
        list.push(bin);
        return bin;
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
            hash: hashEntity(flowEntity),
            entity: flowEntity,
            type: NodeTypes.flow,
            name: parseName(flowEntity),
            id: parseId(flowEntity),
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
        return factory;
    });

    const graph = factoryNodes.length > 0 ? factoryNodes[0] : undefined;
    if (!graph) {
        throw new Error();
    }
    return { graph, list };
};

//------------------------------------------------------------------------------
function parseName(entity: Entity): string {
    const parts = entity.name.split(":");
    return parts.length >= 2 ? parts[1] : entity.name;
}

//------------------------------------------------------------------------------
function parseId(entity: Entity): string | undefined {
    const parts = entity.name.split(":");
    return parts.length >= 3 ? parts[2] : undefined;
}
//------------------------------------------------------------------------------
function inLineage(child: Entity, ancestorEuid: string): boolean {
    const lin = child.lineage?.value ?? "";
    return lin.includes(ancestorEuid);
}

//------------------------------------------------------------------------------
function hashEntity(entity: Entity): string {
    const EUIDs = [entity.euid.value];
    if (entity.lineage) EUIDs.push(...entity.lineage.value);
    const str = EUIDs.join("|");

    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }

    return (hash >>> 0).toString(16).padStart(8, "0").slice(0, 8);
}

//------------------------------------------------------------------------------
export const sortNode = (a: NavGraphNode, b: NavGraphNode) => {
    if (!a.entity.lineage) return -1;
    if (!b.entity.lineage) return 1;
    return a.entity.lineage.ordinal - b.entity.lineage.ordinal;
};

//------------------------------------------------------------------------------
export const isFactory = (node: NavGraphNode): node is FactoryNode => {
    return node.type === NodeTypes.factory;
};

//------------------------------------------------------------------------------
export const isArea = (node: NavGraphNode): node is AreaNode => {
    return node.type === NodeTypes.area;
};

//------------------------------------------------------------------------------
export const isLine = (node: NavGraphNode): node is LineNode => {
    return node.type === NodeTypes.line;
};

//------------------------------------------------------------------------------
export const isCell = (node: NavGraphNode): node is CellNode => {
    return node.type === NodeTypes.cell;
};

//------------------------------------------------------------------------------
export const isMachine = (node: NavGraphNode): node is MachineNode => {
    return node.type === NodeTypes.machine;
};

//------------------------------------------------------------------------------
export const isAisle = (node: NavGraphNode): node is AisleNode => {
    return node.type === NodeTypes.aisle;
};

//------------------------------------------------------------------------------
export const isRack = (node: NavGraphNode): node is RackNode => {
    return node.type === NodeTypes.rack;
};

//------------------------------------------------------------------------------
export const isBin = (node: NavGraphNode): node is BinNode => {
    return node.type === NodeTypes.bin;
};
