/**
 * Factory graph — types, hashing, and 3dverse scene loading.
 *
 * Parses a 3dverse scene into a SiteNode tree (Site → Locations → WorkCenters → Machines).
 * This is the authoritative source of site structure for the generator.
 */

import { getAssetDescription } from "@3dverse/api";
import { NotFound } from "express-openapi-validator/dist/openapi.validator";

// ---------------------------------------------------------------------------
// Node types
// ---------------------------------------------------------------------------

type _NavGraphNode = {
    name: string;
    hash: string;
    lineage: string[];
    ordinal: number;
    tags: Record<string, string>;
};

export enum NodeTypes {
    site = "SITE",
    location = "LOCATION",
    workCenter = "WORK_CENTER",
    machine = "MACHINE",
    aisle = "AISLE",
    rack = "RACK",
    bin = "BIN",
}

export type SiteNode = _NavGraphNode & { type: NodeTypes.site; locations: LocationNode[] };
export type LocationNode = _NavGraphNode & {
    type: NodeTypes.location;
    workCenters: WorkCenterNode[];
    aisles: AisleNode[];
};
export type WorkCenterNode = _NavGraphNode & { type: NodeTypes.workCenter; machines: MachineNode[] };
export type MachineNode = _NavGraphNode & { type: NodeTypes.machine };
export type AisleNode = _NavGraphNode & { type: NodeTypes.aisle; racks: RackNode[] };
export type RackNode = _NavGraphNode & { type: NodeTypes.rack; bins: BinNode[] };
export type BinNode = _NavGraphNode & { type: NodeTypes.bin };
export type GraphNode = SiteNode | LocationNode | WorkCenterNode | MachineNode | AisleNode | RackNode | BinNode;

// ---------------------------------------------------------------------------
// Hashing
// ---------------------------------------------------------------------------

export function hashNode(euid: string, lineage: string[]): string {
    const str = [euid, ...lineage].join("|");
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0").slice(0, 8);
}

// ---------------------------------------------------------------------------
// Sorting helpers
// ---------------------------------------------------------------------------

export const sortNode = (a: GraphNode, b: GraphNode) => {
    if (!a.lineage) return -1;
    if (!b.lineage) return 1;
    return a.ordinal - b.ordinal;
};

export const sortEntity = (a: any, b: any) => {
    if (!a.lineage.value) return -1;
    if (!b.lineage.value) return -1;
    return a.lineage.ordinal - b.lineage.ordinal;
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function parseDebugName(value: string) {
    const [type, name, id] = value.split(":");
    return { type: type ?? null, name: name ?? null, id: id ?? null };
}

// ---------------------------------------------------------------------------
// Scene loaders
// ---------------------------------------------------------------------------
const loadMachine = async (machineEntity: any, _scene_id: string, lineage: string[]): Promise<MachineNode> => {
    const { name } = parseDebugName(machineEntity.debug_name.value);
    return {
        type: NodeTypes.machine,
        lineage,
        ordinal: machineEntity.lineage.ordinal,
        name,
        hash: hashNode(machineEntity.euid.value, lineage),
        tags: loadTags(machineEntity),
    };
};

//------------------------------------------------------------------------------
const loadBin = (binEntity: any, lineage: string[]): BinNode => {
    const { name } = parseDebugName(binEntity.debug_name.value);
    return {
        type: NodeTypes.bin,
        lineage,
        ordinal: binEntity.lineage?.ordinal ?? 0,
        name: name ?? binEntity.debug_name.value,
        hash: hashNode(binEntity.euid.value, lineage),
        tags: loadTags(binEntity),
    };
};

//------------------------------------------------------------------------------
const loadRack = async (rackEntity: any, scene_id: string, lineage: string[]): Promise<RackNode> => {
    const { name } = parseDebugName(rackEntity.debug_name.value);
    const rackLineage = [...lineage, rackEntity.euid.value];
    const rack: RackNode = {
        type: NodeTypes.rack,
        lineage,
        ordinal: rackEntity.lineage?.ordinal ?? 0,
        name: name ?? rackEntity.debug_name.value,
        hash: hashNode(rackEntity.euid.value, lineage),
        bins: [],
        tags: loadTags(rackEntity),
    };

    if (scene_id) {
        const rackScene = (await getAssetDescription({ asset_container: "scenes", asset_id: scene_id })).data;
        const binEntities = (rackScene.entities ?? []).filter((e: any) => {
            if (!e.debug_name?.value?.includes(":")) return false;
            return parseDebugName(e.debug_name.value).type === "bin";
        });
        rack.bins = binEntities.map((e: any) => loadBin(e, rackLineage)).sort(sortNode);
    }

    return rack;
};

//------------------------------------------------------------------------------
const loadAisle = async (aisleEntity: any, scene_id: string, lineage: string[]): Promise<AisleNode> => {
    const { name } = parseDebugName(aisleEntity.debug_name.value);
    const aisleLineage = [...lineage, aisleEntity.euid.value];
    const aisle: AisleNode = {
        type: NodeTypes.aisle,
        lineage,
        ordinal: aisleEntity.lineage?.ordinal ?? 0,
        name: name ?? aisleEntity.debug_name.value,
        hash: hashNode(aisleEntity.euid.value, lineage),
        racks: [],
        tags: loadTags(aisleEntity),
    };

    if (scene_id) {
        const aisleScene = (await getAssetDescription({ asset_container: "scenes", asset_id: scene_id })).data;
        const rackEntities = (aisleScene.entities ?? []).filter((e: any) => {
            if (!e.debug_name?.value?.includes(":")) return false;
            return parseDebugName(e.debug_name.value).type === "rack";
        });
        aisle.racks = await Promise.all(rackEntities.map((e: any) => loadRack(e, e.scene_ref?.value, aisleLineage)));
        aisle.racks.sort(sortNode);
    }

    return aisle;
};

//------------------------------------------------------------------------------
const loadWorkCenter = async (workCenterEntity: any, scene_id: string, lineage: string[]): Promise<WorkCenterNode> => {
    const { name } = parseDebugName(workCenterEntity.debug_name.value);
    const workCenter: WorkCenterNode = {
        type: NodeTypes.workCenter,
        lineage,
        ordinal: workCenterEntity.lineage.ordinal,
        name,
        hash: hashNode(workCenterEntity.euid.value, lineage),
        machines: [],
        tags: loadTags(workCenterEntity),
    };

    const workCenterScene = (await getAssetDescription({ asset_container: "scenes", asset_id: scene_id })).data;
    if (!workCenterScene.entities) throw NotFound;

    const machineEntities: any[] = workCenterScene.entities.filter((entity: any) => {
        if (!entity.scene_ref || !entity.debug_name.value.includes(":")) return false;
        return parseDebugName(entity.debug_name.value).type === "machine";
    });

    workCenter.machines = (
        await Promise.all(
            machineEntities.map((ent) =>
                loadMachine(ent, ent.scene_ref.value, [...lineage, workCenterEntity.euid.value]),
            ),
        )
    ).sort(sortNode);

    return workCenter;
};

//------------------------------------------------------------------------------
const loadLineWorkCenters = async (lineEntity: any, scene_id: string, lineage: string[]): Promise<WorkCenterNode[]> => {
    const lineScene = (await getAssetDescription({ asset_container: "scenes", asset_id: scene_id })).data;
    if (!lineScene.entities) return [];

    const lineLineage = [...lineage, lineEntity.euid.value];
    const workCenterEnts = lineScene.entities.filter((e: any) => {
        if (!e.scene_ref || !e.debug_name.value.includes(":")) return false;
        return parseDebugName(e.debug_name.value).type === "cell";
    });

    return (
        await Promise.all(workCenterEnts.map((ent: any) => loadWorkCenter(ent, ent.scene_ref.value, lineLineage)))
    ).sort(sortNode);
};

//------------------------------------------------------------------------------
const loadLocation = async (locationEntity: any, scene_id: string, lineage: string[]): Promise<LocationNode> => {
    const { name } = parseDebugName(locationEntity.debug_name.value);
    const location: LocationNode = {
        type: NodeTypes.location,
        lineage,
        ordinal: locationEntity.ordinal,
        name,
        hash: hashNode(locationEntity.euid.value, lineage),
        workCenters: [],
        aisles: [],
        tags: loadTags(locationEntity),
    };

    const locationLineage = [...lineage, locationEntity.euid.value];
    const asset_description = (await getAssetDescription({ asset_container: "scenes", asset_id: scene_id })).data;
    if (!asset_description.entities) throw NotFound;

    const cellAndLineEnts: any[] = [];
    const aisleEnts: any[] = [];

    for (const entity of asset_description.entities as any[]) {
        if (!entity.scene_ref || !entity.debug_name.value.includes(":")) continue;
        const { type } = parseDebugName(entity.debug_name.value);
        if (type === "cell" || type === "line") cellAndLineEnts.push(entity);
        else if (type === "aisle") aisleEnts.push(entity);
    }
    cellAndLineEnts.sort(sortEntity);

    const workCenters = (
        await Promise.all(
            cellAndLineEnts.map((ent: any) => {
                const { type } = parseDebugName(ent.debug_name.value);
                switch (type) {
                    case "cell":
                        return loadWorkCenter(ent, ent.scene_ref.value, locationLineage);
                    case "line":
                        return loadLineWorkCenters(ent, ent.scene_ref.value, locationLineage);
                }
            }),
        )
    ).flat();

    location.workCenters = workCenters as WorkCenterNode[];
    location.aisles = (
        await Promise.all(aisleEnts.map((ent: any) => loadAisle(ent, ent.scene_ref?.value, locationLineage)))
    ).sort(sortNode);

    return location;
};

//------------------------------------------------------------------------------
const loadSite = async (siteEntity: any, scene_id: string): Promise<SiteNode> => {
    const { name } = parseDebugName(siteEntity.debug_name.value);
    const lineage: string[] = [];
    const site: SiteNode = {
        type: NodeTypes.site,
        lineage,
        ordinal: siteEntity.lineage.ordinal,
        name,
        hash: hashNode(siteEntity.euid.value, lineage),
        locations: [],
        tags: loadTags(siteEntity),
    };

    const asset_description = (await getAssetDescription({ asset_container: "scenes", asset_id: scene_id })).data;
    if (!asset_description.entities) throw NotFound;

    const locationEntities: any[] = asset_description.entities.filter((entity: any) => {
        if (!entity.scene_ref || !entity.debug_name.value.includes(":")) return false;
        return parseDebugName(entity.debug_name.value).type === "area";
    });

    site.locations = (
        await Promise.all(
            locationEntities.map((ent) => loadLocation(ent, ent.scene_ref?.value, [siteEntity.euid.value])),
        )
    ).sort(sortNode);

    return site;
};

//------------------------------------------------------------------------------
const loadTags = (entity: any) => {
    if (!Array.isArray(entity?.tags?.value)) return {};
    const tags = entity.tags.value.reduce((acc: Record<string, string>, t: string) => {
        const [key, value] = t.split(":");
        if (key && value) acc[key] = value;
        return acc;
    }, {});
    return tags;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function loadSiteFromScene(sceneId: string): Promise<SiteNode | undefined> {
    const asset_description = (await getAssetDescription({ asset_container: "scenes", asset_id: sceneId })).data;
    if (!asset_description.entities) return undefined;
    const siteEntity: any = asset_description.entities.find((ent: any) => {
        if (!ent.scene_ref || !ent.debug_name.value.includes(":")) return false;
        return parseDebugName(ent.debug_name.value).type === "factory";
    });

    return siteEntity ? loadSite(siteEntity, siteEntity.scene_ref?.value) : undefined;
}
