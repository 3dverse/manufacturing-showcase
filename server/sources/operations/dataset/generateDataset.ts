import { getAssetDescription } from "@3dverse/api";
import { DatasetOperationHandler, DatasetreplyJSON } from "../../utils/openAPI";
import { NotFound } from "express-openapi-validator/dist/openapi.validator";

//------------------------------------------------------------------------------
type _NavGraphNode = {
    name: string;
    lineage: string[];
    ordinal: number;
    tags: { [key: string]: string };
};
export type FactoryNode = _NavGraphNode & { type: NodeTypes.factory; areas: AreaNode[] };

//------------------------------------------------------------------------------
export type AreaNode = _NavGraphNode & {
    type: NodeTypes.area;
    lines: LineNode[];
    cells: CellNode[];
};

//------------------------------------------------------------------------------
export type LineNode = _NavGraphNode & { type: NodeTypes.line; cells: CellNode[] };

//------------------------------------------------------------------------------
export type CellNode = _NavGraphNode & {
    type: NodeTypes.cell;
    machines: MachineNode[];
};

//------------------------------------------------------------------------------
export type MachineNode = _NavGraphNode & { type: NodeTypes.machine };

//------------------------------------------------------------------------------
export type GraphNode = FactoryNode | AreaNode | LineNode | CellNode | MachineNode;

//------------------------------------------------------------------------------
export const generateDataset: DatasetOperationHandler<"generateDataset"> = async (c, req, res) => {
    // TODO: implement

    const asset_description = (
        await getAssetDescription({ asset_container: "scenes", asset_id: "3e23233c-0c97-43d7-ab5e-9eb8caa2f42b" })
    ).data;
    if (!asset_description.entities) throw NotFound;
    const factoryEntity: any = asset_description.entities.find((ent: any) => {
        if (!ent.scene_ref || !ent.debug_name.value.includes(":")) return false;
        const { type, name, id } = parseDebugName(ent.debug_name.value);
        return type === "factory";
    });

    const graph = factoryEntity ? await loadFactory(factoryEntity, factoryEntity.scene_ref?.value) : undefined;

    return DatasetreplyJSON({ graph }, res);
};

//------------------------------------------------------------------------------
export enum NodeTypes {
    factory = "FACTORY",
    area = "AREA",
    line = "LINE",
    cell = "CELL",
    machine = "MACHINE",
}

//------------------------------------------------------------------------------
const loadFactory = async (factoryEntity: any, scene_id: string) => {
    const { name } = parseDebugName(factoryEntity.debug_name.value);
    const factory: FactoryNode = {
        type: NodeTypes.factory,
        lineage: [],
        ordinal: factoryEntity.lineage.ordinal,
        name: name,
        areas: [],
        tags: {},
    };
    //--------------------------------------------------------------------------
    // Get areas
    const asset_description = (await getAssetDescription({ asset_container: "scenes", asset_id: scene_id })).data;
    console.log("load fac", scene_id);
    if (!asset_description.entities) throw NotFound;
    const areaEntities: any[] = asset_description.entities.filter((entity: any) => {
        if (!entity.scene_ref || !entity.debug_name.value.includes(":")) return false;
        const { type, name, id } = parseDebugName(entity.debug_name.value);
        return type === "area";
    });

    factory.areas = (
        await Promise.all(
            areaEntities.map((ent) => {
                return loadArea(ent, ent.scene_ref?.value, [factoryEntity.euid.value]);
            }),
        )
    ).sort(sortNode);

    return factory;
};

//------------------------------------------------------------------------------
const loadArea = async (areaEntity: any, scene_id: string, lineage: string[]) => {
    const { name } = parseDebugName(areaEntity.debug_name.value);
    const area: AreaNode = {
        type: NodeTypes.area,
        lineage,
        ordinal: areaEntity.ordinal,
        name: name,
        lines: [],
        cells: [],
        tags: {},
    };
    //--------------------------------------------------------------------------
    // Get lines
    const line_asset_description = (await getAssetDescription({ asset_container: "scenes", asset_id: scene_id })).data;
    if (!line_asset_description.entities) throw NotFound;
    const lineEntities: any[] = line_asset_description.entities.filter((entity: any) => {
        if (!entity.scene_ref || !entity.debug_name.value.includes(":")) return false;
        const { type, name, id } = parseDebugName(entity.debug_name.value);
        return type === "line";
    });

    area.lines = (
        await Promise.all(
            lineEntities.map((ent) => {
                return loadLine(ent, ent.scene_ref.value, [...lineage, areaEntity.euid.value]);
            }),
        )
    ).sort(sortNode);

    //--------------------------------------------------------------------------
    // Get cells
    const cell_asset_description = (await getAssetDescription({ asset_container: "scenes", asset_id: scene_id })).data;
    if (!cell_asset_description.entities) throw NotFound;
    const cellEntities: any[] = cell_asset_description.entities.filter((entity: any) => {
        if (!entity.scene_ref || !entity.debug_name.value.includes(":")) return false;
        const { type, name, id } = parseDebugName(entity.debug_name.value);
        return type === "cell";
    });

    area.cells = (
        await Promise.all(
            cellEntities.map((ent) => {
                return loadCell(ent, ent.scene_ref.value, [...lineage, areaEntity.euid.value]);
            }),
        )
    ).sort(sortNode);

    return area;
};

//------------------------------------------------------------------------------
const loadLine = async (lineEntity: any, scene_id: string, lineage: string[]) => {
    const { name } = parseDebugName(lineEntity.debug_name.value);
    const line: LineNode = {
        type: NodeTypes.line,
        lineage,
        ordinal: lineEntity.lineage.ordinal,
        name: name,
        cells: [],
        tags: {},
    };

    //--------------------------------------------------------------------------
    // Get cells
    const cell_asset_description = (await getAssetDescription({ asset_container: "scenes", asset_id: scene_id })).data;
    if (!cell_asset_description.entities) throw NotFound;
    const cellEntities: any[] = cell_asset_description.entities.filter((entity: any) => {
        if (!entity.scene_ref || !entity.debug_name.value.includes(":")) return false;
        const { type, name, id } = parseDebugName(entity.debug_name.value);
        return type === "cell";
    });

    line.cells = (
        await Promise.all(
            cellEntities.map((ent) => {
                return loadCell(ent, ent.scene_ref.value, [...lineage, lineEntity.euid.value]);
            }),
        )
    ).sort(sortNode);

    return line;
};

//------------------------------------------------------------------------------
const loadCell = async (cellEntity: any, scene_id: string, lineage: string[]) => {
    const { name } = parseDebugName(cellEntity.debug_name.value);
    const cell: CellNode = {
        type: NodeTypes.cell,
        lineage,
        ordinal: cellEntity.lineage.ordinal,
        name: name,
        machines: [],
        tags: {},
    };

    //--------------------------------------------------------------------------
    // Get machines
    const cell_asset_description = (await getAssetDescription({ asset_container: "scenes", asset_id: scene_id })).data;
    if (!cell_asset_description.entities) throw NotFound;
    const cellEntities: any[] = cell_asset_description.entities.filter((entity: any) => {
        if (!entity.scene_ref || !entity.debug_name.value.includes(":")) return false;
        const { type, name, id } = parseDebugName(entity.debug_name.value);
        return type === "machine";
    });

    cell.machines = (
        await Promise.all(
            cellEntities.map((ent) => {
                return loadMachine(ent, ent.scene_ref.value, [...lineage, cellEntity.euid.value]);
            }),
        )
    ).sort(sortNode);

    return cell;
};

//------------------------------------------------------------------------------
const loadMachine = async (machineEntity: any, scene_id: string, lineage: string[]) => {
    const { name } = parseDebugName(machineEntity.debug_name.value);
    const machine: MachineNode = {
        type: NodeTypes.machine,
        lineage,
        ordinal: machineEntity.lineage.ordinal,
        name: name,
        tags: {},
    };

    return machine;
};

//------------------------------------------------------------------------------
export const sortNode = (a: GraphNode, b: GraphNode) => {
    if (!a.lineage) return -1;
    if (!b.lineage) return 1;
    return a.ordinal - b.ordinal;
};

//------------------------------------------------------------------------------
function parseDebugName(value: string) {
    const [type, name, id] = value.split(":");
    return {
        type: type ?? null,
        name: name ?? null,
        id: id ?? null,
    };
}
