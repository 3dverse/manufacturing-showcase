/**
 * Minimal mock SiteNode for local generator testing.
 * Mirrors the real factory structure without requiring a live 3dverse scene.
 *
 * Usage:
 *   npx tsx server/sources/generator/test-generate.ts
 */

import { NodeTypes, hashNode } from "./site";
import type { SiteNode, LocationNode, WorkCenterNode, MachineNode } from "./site";

function makeMachine(name: string, lineage: string[]): MachineNode {
    return { type: NodeTypes.machine, name, hash: hashNode(name, lineage), lineage, ordinal: 0, tags: {} };
}

function makeWC(
    name: string,
    operationType: string,
    lineage: string[],
    machineNames: string[],
): WorkCenterNode {
    const wcLineage = [...lineage, name];
    return {
        type: NodeTypes.workCenter,
        name,
        hash:    hashNode(name, lineage),
        lineage: wcLineage,
        ordinal: 0,
        tags:    { operationType },
        machines: machineNames.map(m => makeMachine(m, wcLineage)),
    };
}

function makeLocation(name: string, siteLineage: string[], workCenters: WorkCenterNode[]): LocationNode {
    return {
        type: NodeTypes.location,
        name,
        hash:    hashNode(name, siteLineage),
        lineage: [...siteLineage, name],
        ordinal: 0,
        tags:    {},
        workCenters,
    };
}

const SITE_LINEAGE: string[] = [];

// Single production area covering all op types — QC inline so it appears in routings.
// One work center per operation type keeps the routing simple and testable.
const productionLocation = makeLocation("Production", SITE_LINEAGE, [
    makeWC("CNC-01",   "MACHINING",       SITE_LINEAGE, ["VC-500", "VARIAXIS-500"]),
    makeWC("PAINT-01", "PAINTING",        SITE_LINEAGE, ["SprayMax-400"]),
    makeWC("ASSY-01",  "ASSEMBLY",        SITE_LINEAGE, ["AX-2000", "PowerFit-Pro"]),
    makeWC("QC-01",    "QUALITY_CONTROL", SITE_LINEAGE, ["CMM-700"]),
]);

// WMS zones — no work centers, purely physical storage/handling areas.
const receptionLocation = makeLocation("Reception", SITE_LINEAGE, []);
const storageLocation   = makeLocation("Storage",   SITE_LINEAGE, []);
const supplyLocation    = makeLocation("Supply",    SITE_LINEAGE, []);
const deliveryLocation  = makeLocation("Delivery",  SITE_LINEAGE, []);

export const mockSite: SiteNode = {
    type:    NodeTypes.site,
    name:    "MockFactory",
    hash:    hashNode("MockFactory", SITE_LINEAGE),
    lineage: SITE_LINEAGE,
    ordinal: 0,
    tags:    {},
    locations: [
        productionLocation,
        receptionLocation,
        storageLocation,
        supplyLocation,
        deliveryLocation,
    ],
};
