import type {
    LocationNode,
    WorkCenterNode,
    SiteNode,
    MachineNode,
} from "./site";

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

export type WMSZones = {
    reception: LocationNode;
    storage:   LocationNode;
    supply:    LocationNode;
    delivery:  LocationNode;
};

/**
 * Returns the four WMS zone locations (Reception, Storage, Supply, Delivery)
 * from the site graph. Returns null if any zone is missing.
 */
export function getWMSZones(site: SiteNode): WMSZones | null {
    const find = (name: string) =>
        site.locations.find(l => l.name.toLowerCase() === name.toLowerCase());
    const reception = find("reception");
    const storage   = find("storage");
    const supply    = find("supply");
    const delivery  = find("delivery");
    if (!reception || !storage || !supply || !delivery) return null;
    return { reception, storage, supply, delivery };
}
