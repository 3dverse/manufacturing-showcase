import { getAssetDescription } from "@3dverse/api";
import { DatasetreplyJSON } from "../../utils/openAPI";
import { NotFound } from "express-openapi-validator/dist/openapi.validator";

//------------------------------------------------------------------------------
type _NavGraphNode = {
    name: string;
    hash: string;
    lineage: string[];
    ordinal: number;
    tags: { [key: string]: string };
};

//------------------------------------------------------------------------------
export function hashNode(euid: string, lineage: string[]): string {
    const str = [euid, ...lineage].join("|");
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0").slice(0, 8);
}
export type SiteNode = _NavGraphNode & { type: NodeTypes.site; locations: LocationNode[] };

//------------------------------------------------------------------------------
export type LocationNode = _NavGraphNode & {
    type: NodeTypes.location;
    workCenters: WorkCenterNode[];
};

//------------------------------------------------------------------------------
export type WorkCenterNode = _NavGraphNode & {
    type: NodeTypes.workCenter;
    machines: MachineNode[];
};

//------------------------------------------------------------------------------
export type MachineNode = _NavGraphNode & { type: NodeTypes.machine };

//------------------------------------------------------------------------------
export type GraphNode = SiteNode | LocationNode | WorkCenterNode | MachineNode;

//------------------------------------------------------------------------------
export async function loadSiteFromScene(sceneId: string): Promise<SiteNode | undefined> {
    const asset_description = (await getAssetDescription({ asset_container: "scenes", asset_id: sceneId })).data;
    if (!asset_description.entities) return undefined;
    // Scene entities use "factory:" as the debug_name prefix for the site root
    const siteEntity: any = asset_description.entities.find((ent: any) => {
        if (!ent.scene_ref || !ent.debug_name.value.includes(":")) return false;
        const { type } = parseDebugName(ent.debug_name.value);
        return type === "factory";
    });
    return siteEntity ? loadSite(siteEntity, siteEntity.scene_ref?.value) : undefined;
}

//------------------------------------------------------------------------------
export const getSiteGraph = async (_c: any, req: any, res: any) => {
    const { sceneId } = req.query as any;
    if (!sceneId) return DatasetreplyJSON({ error: "sceneId query param required" }, res, 400) as any;
    const graph = await loadSiteFromScene(sceneId);
    return DatasetreplyJSON({ graph }, res);
};

//------------------------------------------------------------------------------
export enum NodeTypes {
    site = "SITE",
    location = "LOCATION",
    workCenter = "WORK_CENTER",
    machine = "MACHINE",
}

//------------------------------------------------------------------------------
const loadSite = async (siteEntity: any, scene_id: string) => {
    const { name } = parseDebugName(siteEntity.debug_name.value);
    const lineage: string[] = [];
    const site: SiteNode = {
        type: NodeTypes.site,
        lineage,
        ordinal: siteEntity.lineage.ordinal,
        name: name,
        hash: hashNode(siteEntity.euid.value, lineage),
        locations: [],
        tags: {},
    };
    //--------------------------------------------------------------------------
    // Get locations — scene entities use "area:" as the debug_name prefix
    const asset_description = (await getAssetDescription({ asset_container: "scenes", asset_id: scene_id })).data;
    if (!asset_description.entities) throw NotFound;
    const locationEntities: any[] = asset_description.entities.filter((entity: any) => {
        if (!entity.scene_ref || !entity.debug_name.value.includes(":")) return false;
        const { type } = parseDebugName(entity.debug_name.value);
        return type === "area";
    });

    site.locations = (
        await Promise.all(
            locationEntities.map((ent) => {
                return loadLocation(ent, ent.scene_ref?.value, [siteEntity.euid.value]);
            }),
        )
    ).sort(sortNode);
    return site;
};

//------------------------------------------------------------------------------
const loadLocation = async (locationEntity: any, scene_id: string, lineage: string[]) => {
    const { name } = parseDebugName(locationEntity.debug_name.value);
    const location: LocationNode = {
        type: NodeTypes.location,
        lineage,
        ordinal: locationEntity.ordinal,
        name: name,
        hash: hashNode(locationEntity.euid.value, lineage),
        workCenters: [],
        tags: {},
    };

    const locationLineage: string[] = [...lineage, locationEntity.euid.value];
    const asset_description = (await getAssetDescription({ asset_container: "scenes", asset_id: scene_id })).data;
    if (!asset_description.entities) throw NotFound;

    // Collect direct work center and line entities
    // Scene entities use "cell:" and "line:" as debug_name prefixes
    const locationChildrenEntities = asset_description.entities
        .filter((entity: any) => {
            if (!entity.scene_ref || !entity.debug_name.value.includes(":")) return false;
            const { type } = parseDebugName(entity.debug_name.value);
            return type === "cell" || type === "line";
        })
        .sort(sortEntity);

    const workCenters = (
        await Promise.all(
            locationChildrenEntities.map((ent) => {
                const _ent: any = ent;
                const { type } = parseDebugName(_ent.debug_name.value);
                switch (type) {
                    case "cell":
                        return loadWorkCenter(_ent, _ent.scene_ref.value, locationLineage);
                    case "line":
                        return loadLineWorkCenters(_ent, _ent.scene_ref.value as string, locationLineage);
                }
            }),
        )
    ).flat();

    location.workCenters = workCenters as WorkCenterNode[];

    return location;
};

//------------------------------------------------------------------------------
const loadWorkCenter = async (workCenterEntity: any, scene_id: string, lineage: string[]) => {
    const { name } = parseDebugName(workCenterEntity.debug_name.value);
    const workCenter: WorkCenterNode = {
        type: NodeTypes.workCenter,
        lineage,
        ordinal: workCenterEntity.lineage.ordinal,
        name: name,
        hash: hashNode(workCenterEntity.euid.value, lineage),
        machines: [],
        tags: {},
    };

    //--------------------------------------------------------------------------
    // Get machines — scene entities use "machine:" as the debug_name prefix
    const workCenterScene = (await getAssetDescription({ asset_container: "scenes", asset_id: scene_id })).data;
    if (!workCenterScene.entities) throw NotFound;
    const machineEntities: any[] = workCenterScene.entities.filter((entity: any) => {
        if (!entity.scene_ref || !entity.debug_name.value.includes(":")) return false;
        const { type } = parseDebugName(entity.debug_name.value);
        return type === "machine";
    });

    workCenter.machines = (
        await Promise.all(
            machineEntities.map((ent) => {
                return loadMachine(ent, ent.scene_ref.value, [...lineage, workCenterEntity.euid.value]);
            }),
        )
    ).sort(sortNode);

    return workCenter;
};

//------------------------------------------------------------------------------
const loadLineWorkCenters = async (lineEntity: any, scene_id: string, lineage: string[]): Promise<WorkCenterNode[]> => {
    const lineScene = (await getAssetDescription({ asset_container: "scenes", asset_id: scene_id })).data;
    if (!lineScene.entities) return [];

    const lineLineage = [...lineage, lineEntity.euid.value];
    // Scene entities within a line use "cell:" as the debug_name prefix for work centers
    const workCenterEnts = lineScene.entities.filter((e: any) => {
        if (!e.scene_ref || !e.debug_name.value.includes(":")) return false;
        return parseDebugName(e.debug_name.value).type === "cell";
    });
    return (await Promise.all(workCenterEnts.map((ent: any) => loadWorkCenter(ent, ent.scene_ref.value, lineLineage)))).sort(
        sortNode,
    );
};

//------------------------------------------------------------------------------
const loadMachine = async (machineEntity: any, scene_id: string, lineage: string[]) => {
    const { name } = parseDebugName(machineEntity.debug_name.value);
    const machine: MachineNode = {
        type: NodeTypes.machine,
        lineage,
        ordinal: machineEntity.lineage.ordinal,
        name: name,
        hash: hashNode(machineEntity.euid.value, lineage),
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
export const sortEntity = (a: any, b: any) => {
    if (!a.lineage.value) return -1;
    if (!b.lineage.value) return -1;
    return a.lineage.ordinal - b.lineage.ordinal;
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
