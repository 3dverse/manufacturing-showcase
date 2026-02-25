import { NodeTypes } from "@/content/enums";
import type { AreaNode, CellNode, FactoryGraphNode, FactoryNode, MachineNode } from "@/content/type";
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
                    cells: [],
                };

                list.push(area);

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
                return area;
            })
            .sort((a, b) => sortAreas(a, b, area_categories_sort));

        factory.areas = areaNodes;
        return factory;
    });
    const graph = factoryNodes.length > 0 ? factoryNodes[0] : undefined;
    return { graph, list };
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
