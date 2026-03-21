import type { FactoryNode } from "../../operations/dataset/generateDataset";
import { flattenAreas, flattenCells, flattenMachines, getAreaForCell } from "../graph";
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
    factory: FactoryNode,
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
    assetsByCell: Map<string, string[]>;
} {
    const workCenters = new Map<string, any>();
    const workCenterList: string[] = [];
    const eamLocations = new Map<string, any>();
    const eamLocationList: string[] = [];
    const apsResources = new Map<string, any>();
    const apsResourceList: string[] = [];
    const erpCostCenters = new Map<string, any>();
    const erpCostCenterList: string[] = [];
    const assetsByCell = new Map<string, string[]>();

    const now = new Date().toISOString();

    // Factory-level EAM location
    const factoryLocId = factory.name;
    eamLocations.set(factoryLocId, {
        id: factoryLocId,
        locationCode: factory.name,
        name: prettify(factory.name),
        description: `Manufacturing plant ${factory.name}`,
        siteCode: siteId,
        parentLocationId: null,
        status: "active",
        createdAt: now,
        updatedAt: now,
    });
    eamLocationList.push(factoryLocId);

    // Areas
    for (const area of flattenAreas(factory)) {
        const areaLocId = area.name;

        // EAM location for area
        eamLocations.set(areaLocId, {
            id: areaLocId,
            locationCode: area.name,
            name: prettify(area.name),
            description: `${prettify(area.name)} area`,
            siteCode: siteId,
            parentLocationId: factoryLocId,
            status: "active",
            createdAt: now,
            updatedAt: now,
        });
        eamLocationList.push(areaLocId);

        // ERP cost center for area
        const ccId = `CC-${area.name}`;
        erpCostCenters.set(ccId, {
            id: ccId,
            companyId: "COMP-001",
            code: area.name,
            name: prettify(area.name),
            manager: "Plant Manager",
            status: "active",
        });
        erpCostCenterList.push(ccId);

        // Lines under area
        for (const line of area.lines) {
            const lineLocId = line.name;
            eamLocations.set(lineLocId, {
                id: lineLocId,
                locationCode: line.name,
                name: prettify(line.name),
                description: `Production line ${line.name}`,
                siteCode: siteId,
                parentLocationId: areaLocId,
                status: "active",
                createdAt: now,
                updatedAt: now,
            });
            eamLocationList.push(lineLocId);
        }
    }

    // Cells → WorkCenters + APS Resources + EAM locations
    for (const cell of flattenCells(factory)) {
        const area = getAreaForCell(factory, cell.name);
        const areaCode = area?.name ?? "UNKNOWN";
        const operationType = cell.tags["operationType"] ?? "GENERAL";

        // Determine criticality based on operation type
        const criticality =
            operationType === "MACHINING"
                ? "high"
                : operationType === "ASSEMBLY"
                  ? "medium"
                  : "low";

        // EAM location for cell
        const cellLocParent = area?.lines.find((l) => l.cells.some((c) => c.name === cell.name))?.name ?? areaCode;
        eamLocations.set(cell.name, {
            id: cell.name,
            locationCode: cell.name,
            name: prettify(cell.name),
            description: `Work center ${cell.name} (${operationType})`,
            siteCode: siteId,
            parentLocationId: cellLocParent,
            status: "active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        eamLocationList.push(cell.name);

        // MES WorkCenter
        const wc = {
            id: cell.name,
            siteId,
            code: cell.name,
            name: prettify(cell.name),
            areaCode,
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
        workCenters.set(cell.name, wc);
        workCenterList.push(cell.name);

        // APS Resource
        apsResources.set(cell.name, {
            id: cell.name,
            code: cell.name,
            name: prettify(cell.name),
            type: "work_center",
            finiteCapacity: true,
            calendarId: "CAL-STANDARD",
            schedulingPolicy: "forward",
            maxConcurrentOperations: 1,
            constraintGroup: areaCode,
        });
        apsResourceList.push(cell.name);

        // Machines → EAM Assets + Locations
        const machineIds: string[] = [];
        for (const machine of cell.machines) {
            // EAM location for machine
            eamLocations.set(machine.name, {
                id: machine.name,
                locationCode: machine.name,
                name: prettify(machine.name),
                description: `Machine ${machine.name}`,
                siteCode: siteId,
                parentLocationId: cell.name,
                status: "active",
                createdAt: now,
                updatedAt: now,
            });
            eamLocationList.push(machine.name);
            machineIds.push(machine.name);
        }
        assetsByCell.set(cell.name, machineIds);
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
        assetsByCell,
    };
}
