import { NodeTypes, hashNode } from "./site";
import type { SiteNode } from "./site";
import type { GeneratorConfig, ItemDefinition, ShiftConfig } from "./types";

// ---------------------------------------------------------------------------
// Attach hashes to a statically-defined site tree.
// For the static site, node.name serves as the euid since there are no
// real 3dverse entity UUIDs. The lineage array of ancestor names guarantees
// uniqueness across parallel lines with identically-named workCenters.
// ---------------------------------------------------------------------------
function attachHashes(site: any): SiteNode {
    const nodeHash = (node: any) => hashNode(node.name, node.lineage);
    site.hash = nodeHash(site);
    for (const location of site.locations ?? []) {
        location.hash = nodeHash(location);
        for (const workCenter of location.workCenters ?? []) {
            workCenter.hash = nodeHash(workCenter);
            for (const machine of workCenter.machines ?? []) machine.hash = nodeHash(machine);
        }
    }
    return site as SiteNode;
}

// ---------------------------------------------------------------------------
// Default site graph
//
// Three self-contained production locations. Each location acts as an independent
// production location with its own non-overlapping PO timeline.
//
// PRODUCTION-01: MACHINING → ASSEMBLY → QUALITY_CONTROL
//   (handles items routed through MCH, ASM, QC — hydraulics/mechanical)
//
// PRODUCTION-02: MACHINING → PAINTING → ASSEMBLY → QUALITY_CONTROL
//   (handles items that also require a painting step)
//
// PRODUCTION-03: ASSEMBLY → QUALITY_CONTROL
//   (handles electronics items that skip machining)
// ---------------------------------------------------------------------------
export const defaultSite: SiteNode = attachHashes({
    type: NodeTypes.site,
    name: "PLANT-01",
    lineage: [],
    ordinal: 0,
    tags: {},
    locations: [
        {
            type: NodeTypes.location,
            name: "PRODUCTION-01",
            lineage: ["PLANT-01"],
            ordinal: 0,
            tags: {},
            workCenters: [
                {
                    type: NodeTypes.workCenter,
                    name: "WC-MCH-01",
                    lineage: ["PLANT-01", "PRODUCTION-01"],
                    ordinal: 0,
                    tags: { operationType: "MACHINING" },
                    machines: [
                        {
                            type: NodeTypes.machine,
                            name: "MCH-01-A",
                            lineage: ["PLANT-01", "PRODUCTION-01", "WC-MCH-01"],
                            ordinal: 0,
                            tags: {},
                        },
                        {
                            type: NodeTypes.machine,
                            name: "MCH-01-B",
                            lineage: ["PLANT-01", "PRODUCTION-01", "WC-MCH-01"],
                            ordinal: 1,
                            tags: {},
                        },
                    ],
                },
                {
                    type: NodeTypes.workCenter,
                    name: "WC-ASM-01",
                    lineage: ["PLANT-01", "PRODUCTION-01"],
                    ordinal: 1,
                    tags: { operationType: "ASSEMBLY" },
                    machines: [
                        {
                            type: NodeTypes.machine,
                            name: "ASM-01-A",
                            lineage: ["PLANT-01", "PRODUCTION-01", "WC-ASM-01"],
                            ordinal: 0,
                            tags: {},
                        },
                        {
                            type: NodeTypes.machine,
                            name: "ASM-01-B",
                            lineage: ["PLANT-01", "PRODUCTION-01", "WC-ASM-01"],
                            ordinal: 1,
                            tags: {},
                        },
                    ],
                },
                {
                    type: NodeTypes.workCenter,
                    name: "WC-QC-01",
                    lineage: ["PLANT-01", "PRODUCTION-01"],
                    ordinal: 2,
                    tags: { operationType: "QUALITY_CONTROL" },
                    machines: [
                        {
                            type: NodeTypes.machine,
                            name: "QC-01-A",
                            lineage: ["PLANT-01", "PRODUCTION-01", "WC-QC-01"],
                            ordinal: 0,
                            tags: {},
                        },
                    ],
                },
            ],
        },
        {
            type: NodeTypes.location,
            name: "PRODUCTION-02",
            lineage: ["PLANT-01"],
            ordinal: 1,
            tags: {},
            workCenters: [
                {
                    type: NodeTypes.workCenter,
                    name: "WC-MCH-02",
                    lineage: ["PLANT-01", "PRODUCTION-02"],
                    ordinal: 0,
                    tags: { operationType: "MACHINING" },
                    machines: [
                        {
                            type: NodeTypes.machine,
                            name: "MCH-02-A",
                            lineage: ["PLANT-01", "PRODUCTION-02", "WC-MCH-02"],
                            ordinal: 0,
                            tags: {},
                        },
                    ],
                },
                {
                    type: NodeTypes.workCenter,
                    name: "WC-PNT-01",
                    lineage: ["PLANT-01", "PRODUCTION-02"],
                    ordinal: 1,
                    tags: { operationType: "PAINTING" },
                    machines: [
                        {
                            type: NodeTypes.machine,
                            name: "PNT-01-A",
                            lineage: ["PLANT-01", "PRODUCTION-02", "WC-PNT-01"],
                            ordinal: 0,
                            tags: {},
                        },
                    ],
                },
                {
                    type: NodeTypes.workCenter,
                    name: "WC-ASM-02",
                    lineage: ["PLANT-01", "PRODUCTION-02"],
                    ordinal: 2,
                    tags: { operationType: "ASSEMBLY" },
                    machines: [
                        {
                            type: NodeTypes.machine,
                            name: "ASM-02-A",
                            lineage: ["PLANT-01", "PRODUCTION-02", "WC-ASM-02"],
                            ordinal: 0,
                            tags: {},
                        },
                        {
                            type: NodeTypes.machine,
                            name: "ASM-02-B",
                            lineage: ["PLANT-01", "PRODUCTION-02", "WC-ASM-02"],
                            ordinal: 1,
                            tags: {},
                        },
                    ],
                },
                {
                    type: NodeTypes.workCenter,
                    name: "WC-QC-02",
                    lineage: ["PLANT-01", "PRODUCTION-02"],
                    ordinal: 3,
                    tags: { operationType: "QUALITY_CONTROL" },
                    machines: [
                        {
                            type: NodeTypes.machine,
                            name: "QC-02-A",
                            lineage: ["PLANT-01", "PRODUCTION-02", "WC-QC-02"],
                            ordinal: 0,
                            tags: {},
                        },
                    ],
                },
            ],
        },
        {
            type: NodeTypes.location,
            name: "PRODUCTION-03",
            lineage: ["PLANT-01"],
            ordinal: 2,
            tags: {},
            workCenters: [
                {
                    type: NodeTypes.workCenter,
                    name: "WC-ASM-03",
                    lineage: ["PLANT-01", "PRODUCTION-03"],
                    ordinal: 0,
                    tags: { operationType: "ASSEMBLY" },
                    machines: [
                        {
                            type: NodeTypes.machine,
                            name: "ASM-03-A",
                            lineage: ["PLANT-01", "PRODUCTION-03", "WC-ASM-03"],
                            ordinal: 0,
                            tags: {},
                        },
                        {
                            type: NodeTypes.machine,
                            name: "ASM-03-B",
                            lineage: ["PLANT-01", "PRODUCTION-03", "WC-ASM-03"],
                            ordinal: 1,
                            tags: {},
                        },
                    ],
                },
                {
                    type: NodeTypes.workCenter,
                    name: "WC-QC-03",
                    lineage: ["PLANT-01", "PRODUCTION-03"],
                    ordinal: 1,
                    tags: { operationType: "QUALITY_CONTROL" },
                    machines: [
                        {
                            type: NodeTypes.machine,
                            name: "QC-03-A",
                            lineage: ["PLANT-01", "PRODUCTION-03", "WC-QC-03"],
                            ordinal: 0,
                            tags: {},
                        },
                    ],
                },
            ],
        },
    ],
});

// ---------------------------------------------------------------------------
// Default items
// ---------------------------------------------------------------------------
export const defaultItems: ItemDefinition[] = [
    {
        id: "FG-100045",
        itemNumber: "FG-100045",
        name: "Hydraulic Pump Assembly",
        description: "High-pressure hydraulic pump assembly for industrial applications",
        itemType: "finished_good",
        uom: "pcs",
        standardCost: 1250.0,
        currency: "USD",
        routing: [
            {
                operationCode: "MCH-10",
                operationDescription: "CNC Machining",
                workCenterOperationType: "MACHINING",
                setupTimeMinutes: 30,
                runTimeMinutes: 240,
                defects: ["DIMENSIONAL_OOT", "SURFACE_FINISH", "TOOL_MARK", "BROKEN_PART"],
            },
            {
                operationCode: "ASM-20",
                operationDescription: "Pump Assembly",
                workCenterOperationType: "ASSEMBLY",
                setupTimeMinutes: 15,
                runTimeMinutes: 180,
                defects: ["MISSING_COMPONENT", "TORQUE_OOT", "COSMETIC_DAMAGE", "ASSEMBLY_ERROR"],
            },
            {
                operationCode: "QC-40",
                operationDescription: "Quality Inspection",
                workCenterOperationType: "QUALITY_CONTROL",
                setupTimeMinutes: 10,
                runTimeMinutes: 60,
                defects: ["DIMENSIONAL_OOT", "FUNCTIONAL_FAILURE", "COSMETIC_DAMAGE", "DOCUMENTATION_ERROR"],
            },
        ],
        components: [
            { itemId: "RM-STEEL-BAR", quantity: 2, uom: "pcs" },
            { itemId: "RM-SEAL-KIT", quantity: 1, uom: "kit" },
            { itemId: "RM-FASTENERS", quantity: 1, uom: "set" },
        ],
    },
    {
        id: "FG-100087",
        itemNumber: "FG-100087",
        name: "Control Valve Block",
        description: "Precision-machined hydraulic control valve block",
        itemType: "finished_good",
        uom: "pcs",
        standardCost: 875.0,
        currency: "USD",
        routing: [
            {
                operationCode: "MCH-10",
                operationDescription: "CNC Machining",
                workCenterOperationType: "MACHINING",
                setupTimeMinutes: 25,
                runTimeMinutes: 180,
                defects: ["DIMENSIONAL_OOT", "SURFACE_FINISH", "TOOL_MARK", "BROKEN_PART"],
            },
            {
                operationCode: "ASM-20",
                operationDescription: "Valve Assembly",
                workCenterOperationType: "ASSEMBLY",
                setupTimeMinutes: 15,
                runTimeMinutes: 120,
                defects: ["MISSING_COMPONENT", "TORQUE_OOT", "COSMETIC_DAMAGE", "ASSEMBLY_ERROR"],
            },
            {
                operationCode: "QC-40",
                operationDescription: "Quality Inspection",
                workCenterOperationType: "QUALITY_CONTROL",
                setupTimeMinutes: 10,
                runTimeMinutes: 45,
                defects: ["DIMENSIONAL_OOT", "FUNCTIONAL_FAILURE", "COSMETIC_DAMAGE", "DOCUMENTATION_ERROR"],
            },
        ],
        components: [
            { itemId: "RM-ALU-BLOCK", quantity: 1, uom: "pcs" },
            { itemId: "RM-SEAL-KIT", quantity: 2, uom: "kit" },
            { itemId: "RM-FASTENERS", quantity: 1, uom: "set" },
        ],
    },
    {
        id: "FG-200031",
        itemNumber: "FG-200031",
        name: "Transmission Housing",
        description: "Cast and machined transmission housing with painted finish",
        itemType: "finished_good",
        uom: "pcs",
        standardCost: 2100.0,
        currency: "USD",
        routing: [
            {
                operationCode: "MCH-10",
                operationDescription: "CNC Machining",
                workCenterOperationType: "MACHINING",
                setupTimeMinutes: 45,
                runTimeMinutes: 360,
                defects: ["DIMENSIONAL_OOT", "SURFACE_FINISH", "TOOL_MARK", "BROKEN_PART"],
            },
            {
                operationCode: "PNT-15",
                operationDescription: "Primer and Painting",
                workCenterOperationType: "PAINTING",
                setupTimeMinutes: 20,
                runTimeMinutes: 90,
                defects: ["COATING_THIN", "PAINT_ADHESION", "SURFACE_CONTAMINATION"],
            },
            {
                operationCode: "ASM-20",
                operationDescription: "Housing Assembly",
                workCenterOperationType: "ASSEMBLY",
                setupTimeMinutes: 20,
                runTimeMinutes: 300,
                defects: ["MISSING_COMPONENT", "TORQUE_OOT", "COSMETIC_DAMAGE", "ASSEMBLY_ERROR"],
            },
            {
                operationCode: "QC-40",
                operationDescription: "Quality Inspection",
                workCenterOperationType: "QUALITY_CONTROL",
                setupTimeMinutes: 15,
                runTimeMinutes: 90,
                defects: ["DIMENSIONAL_OOT", "FUNCTIONAL_FAILURE", "COSMETIC_DAMAGE", "DOCUMENTATION_ERROR"],
            },
        ],
        components: [
            { itemId: "RM-STEEL-BAR", quantity: 3, uom: "pcs" },
            { itemId: "RM-FASTENERS", quantity: 2, uom: "set" },
        ],
    },
    {
        id: "FG-200055",
        itemNumber: "FG-200055",
        name: "Gear Assembly Kit",
        description: "Complete gear assembly with precision steel and aluminum components",
        itemType: "finished_good",
        uom: "pcs",
        standardCost: 1680.0,
        currency: "USD",
        routing: [
            {
                operationCode: "MCH-10",
                operationDescription: "Gear Machining",
                workCenterOperationType: "MACHINING",
                setupTimeMinutes: 40,
                runTimeMinutes: 300,
                defects: ["DIMENSIONAL_OOT", "SURFACE_FINISH", "TOOL_MARK", "BROKEN_PART"],
            },
            {
                operationCode: "ASM-20",
                operationDescription: "Gear Assembly",
                workCenterOperationType: "ASSEMBLY",
                setupTimeMinutes: 20,
                runTimeMinutes: 240,
                defects: ["MISSING_COMPONENT", "TORQUE_OOT", "COSMETIC_DAMAGE", "ASSEMBLY_ERROR"],
            },
            {
                operationCode: "QC-40",
                operationDescription: "Quality Inspection",
                workCenterOperationType: "QUALITY_CONTROL",
                setupTimeMinutes: 10,
                runTimeMinutes: 60,
                defects: ["DIMENSIONAL_OOT", "FUNCTIONAL_FAILURE", "COSMETIC_DAMAGE", "DOCUMENTATION_ERROR"],
            },
        ],
        components: [
            { itemId: "RM-STEEL-BAR", quantity: 2, uom: "pcs" },
            { itemId: "RM-ALU-BLOCK", quantity: 1, uom: "pcs" },
            { itemId: "RM-FASTENERS", quantity: 3, uom: "set" },
        ],
    },
    {
        id: "FG-300012",
        itemNumber: "FG-300012",
        name: "Electronic Control Unit",
        description: "Programmable electronic control unit for industrial automation",
        itemType: "finished_good",
        uom: "pcs",
        standardCost: 520.0,
        currency: "USD",
        routing: [
            {
                operationCode: "ASM-20",
                operationDescription: "PCB Assembly",
                workCenterOperationType: "ASSEMBLY",
                setupTimeMinutes: 15,
                runTimeMinutes: 120,
                defects: ["SOLDER_DEFECT", "SHORT_CIRCUIT", "MISSING_COMPONENT", "CALIBRATION_FAIL"],
            },
            {
                operationCode: "ASM-30",
                operationDescription: "Final ECU Assembly",
                workCenterOperationType: "ASSEMBLY",
                setupTimeMinutes: 20,
                runTimeMinutes: 180,
                defects: ["NO_POWER", "SHORT_CIRCUIT", "ASSEMBLY_ERROR", "COSMETIC_DAMAGE"],
            },
            {
                operationCode: "QC-40",
                operationDescription: "Functional Testing",
                workCenterOperationType: "QUALITY_CONTROL",
                setupTimeMinutes: 10,
                runTimeMinutes: 90,
                defects: ["FUNCTIONAL_FAILURE", "CALIBRATION_FAIL", "DOCUMENTATION_ERROR", "COSMETIC_DAMAGE"],
            },
        ],
        components: [
            { itemId: "RM-PCB-BLANK", quantity: 1, uom: "pcs" },
            { itemId: "RM-FASTENERS", quantity: 1, uom: "set" },
        ],
    },
    {
        id: "FG-300078",
        itemNumber: "FG-300078",
        name: "Sensor Module",
        description: "Industrial sensor module with sealed electronics",
        itemType: "finished_good",
        uom: "pcs",
        standardCost: 290.0,
        currency: "USD",
        routing: [
            {
                operationCode: "ASM-20",
                operationDescription: "Sensor Assembly",
                workCenterOperationType: "ASSEMBLY",
                setupTimeMinutes: 10,
                runTimeMinutes: 120,
                defects: ["SOLDER_DEFECT", "SHORT_CIRCUIT", "MISSING_COMPONENT", "CALIBRATION_FAIL"],
            },
            {
                operationCode: "QC-40",
                operationDescription: "Quality Inspection",
                workCenterOperationType: "QUALITY_CONTROL",
                setupTimeMinutes: 10,
                runTimeMinutes: 60,
                defects: ["FUNCTIONAL_FAILURE", "CALIBRATION_FAIL", "DOCUMENTATION_ERROR", "COSMETIC_DAMAGE"],
            },
        ],
        components: [
            { itemId: "RM-PCB-BLANK", quantity: 1, uom: "pcs" },
            { itemId: "RM-SEAL-KIT", quantity: 1, uom: "kit" },
        ],
    },
    // Raw materials
    {
        id: "RM-STEEL-BAR",
        itemNumber: "RM-STEEL-BAR",
        name: "Steel Bar Stock",
        description: "Cold-rolled steel bar stock 50mm diameter",
        itemType: "raw_material",
        uom: "pcs",
        standardCost: 45.0,
        currency: "USD",
        routing: [],
        components: [],
    },
    {
        id: "RM-ALU-BLOCK",
        itemNumber: "RM-ALU-BLOCK",
        name: "Aluminum Block",
        description: "6061-T6 aluminum billet 150mm×100mm×80mm",
        itemType: "raw_material",
        uom: "pcs",
        standardCost: 38.0,
        currency: "USD",
        routing: [],
        components: [],
    },
    {
        id: "RM-SEAL-KIT",
        itemNumber: "RM-SEAL-KIT",
        name: "Seal Kit",
        description: "Hydraulic seal kit with O-rings and gaskets",
        itemType: "raw_material",
        uom: "kit",
        standardCost: 22.0,
        currency: "USD",
        routing: [],
        components: [],
    },
    {
        id: "RM-FASTENERS",
        itemNumber: "RM-FASTENERS",
        name: "Fastener Set",
        description: "Stainless steel fastener assortment M4-M12",
        itemType: "raw_material",
        uom: "set",
        standardCost: 12.0,
        currency: "USD",
        routing: [],
        components: [],
    },
    {
        id: "RM-PCB-BLANK",
        itemNumber: "RM-PCB-BLANK",
        name: "PCB Blank",
        description: "4-layer PCB blank 100mm×80mm",
        itemType: "raw_material",
        uom: "pcs",
        standardCost: 18.0,
        currency: "USD",
        routing: [],
        components: [],
    },
];

// ---------------------------------------------------------------------------
// Default shift configuration
// ---------------------------------------------------------------------------
export const defaultShiftConfig: ShiftConfig = {
    shifts: [
        { name: "Day", startHour: 6, durationHours: 8 },
        { name: "Afternoon", startHour: 14, durationHours: 8 },
        { name: "Night", startHour: 22, durationHours: 8 },
    ],
    workDays: [1, 2, 3, 4, 5], // Mon-Fri
    timezone: "America/Toronto",
};

// ---------------------------------------------------------------------------
// Default generator config
// ---------------------------------------------------------------------------
export const STATIC_SITE_ID = "PLANT-01";

export const defaultGeneratorConfig: GeneratorConfig = {
    seed: 42,
    siteId: STATIC_SITE_ID,
    now: new Date(),
    monthsBack: 2,
    monthsForward: 1,
    site: defaultSite,
    items: defaultItems,
    shifts: defaultShiftConfig,
    scenarios: [],
};
