import type {
    LocationNode,
    WorkCenterNode,
    SiteNode,
    MachineNode,
} from "../operations/dataset/generateDataset";

export function flattenWorkCenters(site: SiteNode): WorkCenterNode[] {
    return site.locations.flatMap((a) => a.workCenters);
}

export function flattenMachines(site: SiteNode): MachineNode[] {
    return flattenWorkCenters(site).flatMap((c) => c.machines);
}

export function flattenLocations(site: SiteNode): LocationNode[] {
    return site.locations;
}

/** Locations whose name contains "production" (case-insensitive). */
export function getProductionLocations(site: SiteNode): LocationNode[] {
    return site.locations.filter((a) => a.name.toUpperCase().includes("PRODUCTION"));
}

/** All workCenters belonging to an location. */
export function getWorkCentersForLocation(location: LocationNode): WorkCenterNode[] {
    return location.workCenters;
}

export function getWorkCentersByOperationType(site: SiteNode, operationType: string): WorkCenterNode[] {
    const all = flattenWorkCenters(site);
    const tagged = all.filter((c) => c.tags["operationType"] === operationType);
    return tagged.length > 0 ? tagged : all;
}

export function getLocationForWorkCenter(site: SiteNode, workCenterName: string): LocationNode | undefined {
    for (const location of site.locations) {
        if (location.workCenters.some((c) => c.name === workCenterName)) return location;
    }
    return undefined;
}

export function getMachinesForWorkCenter(site: SiteNode, workCenterName: string): MachineNode[] {
    for (const workCenter of flattenWorkCenters(site)) {
        if (workCenter.name === workCenterName) return workCenter.machines;
    }
    return [];
}

/** Returns the production location (MES location) that a machine belongs to, or undefined. */
export function getLocationForMachine(site: SiteNode, machineHash: string): LocationNode | undefined {
    for (const location of site.locations) {
        for (const workCenter of getWorkCentersForLocation(location)) {
            if (workCenter.machines.some((m) => m.hash === machineHash)) return location;
        }
    }
    return undefined;
}
