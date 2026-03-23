import type { SiteNode } from "../../operations/dataset/generateDataset";
import { flattenLocations, flattenWorkCenters, flattenMachines, getLocationForWorkCenter } from "../graph";
import type { RNG } from "../rng";

function prettify(name: string): string {
    return name
        .replace(/-/g, " ")
        .replace(/_/g, " ")
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
}

export function generateStructural(
    site: SiteNode,
    siteId: string,
    _rng: RNG,
): {
    workCenters: Map<string, any>;
    workCenterList: string[];
    eamLocations: Map<string, any>;
    eamLocationList: string[];
    apsResources: Map<string, any>;
    apsResourceList: string[];
    erpCostCenters: Map<string, any>;
    erpCostCenterList: string[];
    assetsByWorkCenter: Map<string, string[]>;
} {
    const workCenters = new Map<string, any>();
    const workCenterList: string[] = [];
    const eamLocations = new Map<string, any>();
    const eamLocationList: string[] = [];
    const apsResources = new Map<string, any>();
    const apsResourceList: string[] = [];
    const erpCostCenters = new Map<string, any>();
    const erpCostCenterList: string[] = [];
    const assetsByWorkCenter = new Map<string, string[]>();

    const now = new Date().toISOString();

    // Site-level EAM location
    const siteLocId = site.hash;
    eamLocations.set(siteLocId, {
        id: siteLocId,
        locationCode: site.name,
        name: prettify(site.name),
        description: `Manufacturing plant ${site.name}`,
        siteCode: siteId,
        parentLocationId: null,
        status: "active",
        createdAt: now,
        updatedAt: now,
    });
    eamLocationList.push(siteLocId);

    // Locations
    for (const location of flattenLocations(site)) {
        const locationLocId = location.hash;

        // EAM location for location
        eamLocations.set(locationLocId, {
            id: locationLocId,
            locationCode: location.name,
            name: prettify(location.name),
            description: `${prettify(location.name)} location`,
            siteCode: siteId,
            parentLocationId: siteLocId,
            status: "active",
            createdAt: now,
            updatedAt: now,
        });
        eamLocationList.push(locationLocId);

        // ERP cost center for location
        const ccId = `CC-${location.hash}`;
        erpCostCenters.set(ccId, {
            id: ccId,
            companyId: "COMP-001",
            code: location.name,
            name: prettify(location.name),
            manager: "Plant Manager",
            status: "active",
        });
        erpCostCenterList.push(ccId);

    }

    // WorkCenters → WorkCenters + APS Resources + EAM locations
    for (const workCenter of flattenWorkCenters(site)) {
        const location = getLocationForWorkCenter(site, workCenter.name);
        const locationCode = location?.name ?? "UNKNOWN";
        const operationType = workCenter.tags["operationType"] ?? "GENERAL";

        // Determine criticality based on operation type
        const criticality =
            operationType === "MACHINING"
                ? "high"
                : operationType === "ASSEMBLY"
                  ? "medium"
                  : "low";

        // EAM location for workCenter
        const workCenterLocParent = location?.hash ?? locationCode;
        eamLocations.set(workCenter.hash, {
            id: workCenter.hash,
            locationCode: workCenter.name,
            name: prettify(workCenter.name),
            description: `Work center ${workCenter.name} (${operationType})`,
            siteCode: siteId,
            parentLocationId: workCenterLocParent,
            status: "active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        eamLocationList.push(workCenter.hash);

        // MES WorkCenter
        const wc = {
            id: workCenter.hash,
            siteId,
            code: workCenter.name,
            name: prettify(workCenter.name),
            locationCode,
            status: "idle",
            activeProductionOrderId: null,
            activeOperationId: null,
            utilizationPercent: 0,
            queueLength: 0,
            runtimeMinutes: 0,
            downtimeMinutes: 0,
            goodQuantity: 0,
            scrapQuantity: 0,
            operationType,
            criticality,
        };
        workCenters.set(workCenter.hash, wc);
        workCenterList.push(workCenter.hash);

        // APS Resource
        apsResources.set(workCenter.hash, {
            id: workCenter.hash,
            code: workCenter.name,
            name: prettify(workCenter.name),
            type: "work_center",
            finiteCapacity: true,
            calendarId: "CAL-STANDARD",
            schedulingPolicy: "forward",
            maxConcurrentOperations: 1,
            constraintGroup: locationCode,
        });
        apsResourceList.push(workCenter.hash);

        // Machines → EAM Assets + Locations
        const machineIds: string[] = [];
        for (const machine of workCenter.machines) {
            // EAM location for machine
            eamLocations.set(machine.hash, {
                id: machine.hash,
                locationCode: machine.name,
                name: prettify(machine.name),
                description: `Machine ${machine.name}`,
                siteCode: siteId,
                parentLocationId: workCenter.hash,
                status: "active",
                createdAt: now,
                updatedAt: now,
            });
            eamLocationList.push(machine.hash);
            machineIds.push(machine.hash);
        }
        assetsByWorkCenter.set(workCenter.hash, machineIds);
    }

    return {
        workCenters,
        workCenterList,
        eamLocations,
        eamLocationList,
        apsResources,
        apsResourceList,
        erpCostCenters,
        erpCostCenterList,
        assetsByWorkCenter,
    };
}
