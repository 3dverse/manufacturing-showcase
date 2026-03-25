/**
 * Phase 1 — Entity creation.
 *
 * Produces all named entities that exist independently of time:
 *   - Generation-only templates (PO templates, downtime templates, maintenance plan templates)
 *   - MES work centers
 *   - EAM locations, assets, and maintenance plan records
 *   - ERP master data (company, currencies, GL accounts, cost centers, customers, suppliers, items)
 *   - WMS master data (warehouses, bin locations)
 *   - APS master data (plan, scenario, resources)
 *
 * Templates do not appear in the final dataset; they drive Phase 2 placement.
 */

import type { RNG } from "../rng";
import type { GeneratorConfig } from "../config";
import {
    getProductionLocations,
    flattenWorkCenters,
} from "../graph";
import { addDays } from "../shifts";

// ---------------------------------------------------------------------------
// Generation-only template types
// ---------------------------------------------------------------------------

export type OperationTemplate = {
    operationType:  string;
    setupMinutes:   number;
    workCenterId:   string;
    workCenterName: string;
};

export type POTemplate = {
    locationId:   string;
    locationName: string;
    itemId:       string;        // finished-good item produced here
    operations:   OperationTemplate[];
};

export type DowntimeTemplate = {
    code:               string;
    description:        string;
    minDurationMinutes: number;
    maxDurationMinutes: number;
};

export type MaintenancePlanTemplate = {
    planId:          string;
    assetId:         string;
    assetName:       string;
    workCenterId:    string;
    locationId:      string;
    frequencyDays:   number;
    pmDurationHours: number;
    nextDue:         Date;  // mutable during Phase 2
};

// ---------------------------------------------------------------------------
// Static data pools
// ---------------------------------------------------------------------------

const DOWNTIME_POOL: DowntimeTemplate[] = [
    { code: "TOOLING_FAILURE",   description: "Tool breakage or excessive wear",           minDurationMinutes: 15,  maxDurationMinutes: 90  },
    { code: "MATERIAL_JAM",      description: "Workpiece stuck or misaligned",             minDurationMinutes: 10,  maxDurationMinutes: 45  },
    { code: "SENSOR_FAULT",      description: "Erroneous sensor reading, recalibration",   minDurationMinutes: 20,  maxDurationMinutes: 60  },
    { code: "POWER_FLUCTUATION", description: "Brief electrical interruption",             minDurationMinutes: 5,   maxDurationMinutes: 30  },
    { code: "COOLANT_LEAK",      description: "Coolant leak, requires cleanup",            minDurationMinutes: 30,  maxDurationMinutes: 120 },
    { code: "CHANGEOVER_DELAY",  description: "Unplanned operator changeover delay",       minDurationMinutes: 10,  maxDurationMinutes: 30  },
];

const DEFAULT_SETUP_MINUTES: Record<string, number> = {
    MACHINING:       30,
    ASSEMBLY:        15,
    PAINTING:        20,
    QUALITY_CONTROL: 10,
};

// Finished-good name/cost derived from a location's ordered operation-type set
const FG_BY_OP_TYPES: Record<string, { name: string; cost: number }> = {
    "ASSEMBLY,QUALITY_CONTROL":                   { name: "Electronic Module",    cost:  520 },
    "MACHINING,ASSEMBLY,QUALITY_CONTROL":          { name: "Hydraulic Assembly",   cost: 1250 },
    "MACHINING,PAINTING,ASSEMBLY,QUALITY_CONTROL": { name: "Transmission Housing", cost: 2100 },
    "MACHINING,QUALITY_CONTROL":                   { name: "Precision Component",  cost:  875 },
    "PAINTING,ASSEMBLY,QUALITY_CONTROL":           { name: "Coated Assembly",      cost:  980 },
};

const RAW_MATERIALS = [
    { id: "RM-STEEL-BAR",    name: "Steel Bar Stock",          uom: "pcs", cost: 45.0 },
    { id: "RM-ALU-BLOCK",    name: "Aluminum Block",           uom: "pcs", cost: 38.0 },
    { id: "RM-PAINT-PRIMER", name: "Industrial Paint Primer",  uom: "L",   cost:  8.5 },
    { id: "RM-PCB-BLANK",    name: "PCB Blank",                uom: "pcs", cost: 18.0 },
    { id: "RM-FASTENERS",    name: "Fastener Set",             uom: "set", cost: 12.0 },
    { id: "RM-SEAL-KIT",     name: "Seal Kit",                 uom: "kit", cost: 22.0 },
];

const CUSTOMER_POOL = [
    { name: "Apex Dynamics Ltd.",          code: "CUST-001", country: "USA",     paymentTermsDays: 30 },
    { name: "Meridian Industrial Corp.",   code: "CUST-002", country: "USA",     paymentTermsDays: 30 },
    { name: "Vortex Systems Inc.",         code: "CUST-003", country: "Canada",  paymentTermsDays: 45 },
    { name: "Titan Engineering GmbH",      code: "CUST-004", country: "Germany", paymentTermsDays: 60 },
    { name: "Nova Automation S.A.",        code: "CUST-005", country: "France",  paymentTermsDays: 60 },
    { name: "Crestline Manufacturing LLC", code: "CUST-006", country: "USA",     paymentTermsDays: 30 },
    { name: "Orbital Precision Inc.",      code: "CUST-007", country: "USA",     paymentTermsDays: 45 },
    { name: "Summit Industrial Group",     code: "CUST-008", country: "Canada",  paymentTermsDays: 30 },
];

const SUPPLIER_POOL = [
    { name: "Steelmark Materials Co.",   code: "SUPP-001", country: "USA",     leadTimeDays: 7,  paymentTermsDays: 30 },
    { name: "Alloy Components Ltd.",     code: "SUPP-002", country: "Canada",  leadTimeDays: 10, paymentTermsDays: 45 },
    { name: "Precision Parts GmbH",      code: "SUPP-003", country: "Germany", leadTimeDays: 14, paymentTermsDays: 60 },
    { name: "TechSource Supplies Inc.",  code: "SUPP-004", country: "USA",     leadTimeDays: 5,  paymentTermsDays: 30 },
    { name: "Global Fab Materials Ltd.", code: "SUPP-005", country: "Mexico",  leadTimeDays: 8,  paymentTermsDays: 30 },
];

const MANUFACTURERS = ["Mazak", "Fanuc", "ABB", "Siemens", "DMG Mori", "Okuma", "Haas"];
const MACHINE_MODELS: Record<string, string[]> = {
    MACHINING:       ["VC-500", "VARIAXIS-500", "INTEGREX-200"],
    ASSEMBLY:        ["AX-2000", "PowerFit-Pro", "SmartAssembly-300"],
    PAINTING:        ["SprayMax-400", "AutoCoat-200"],
    QUALITY_CONTROL: ["CMM-700", "ScanMaster-500"],
    DEFAULT:         ["Industrial-300", "AutoMatic-200"],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function prettify(name: string): string {
    return name
        .replace(/[-_]/g, " ")
        .split(" ")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
}

// ---------------------------------------------------------------------------
// Phase 1 result type
// ---------------------------------------------------------------------------

export type Phase1Result = {
    // Generation-only
    poTemplates:              Map<string, POTemplate>;         // locationId → template
    downtimeTemplates:        DowntimeTemplate[];
    maintenancePlanTemplates: MaintenancePlanTemplate[];       // one per machine

    // MES
    workCenters:              Map<string, any>;
    workCenterList:           string[];

    // EAM
    eamAssets:                Map<string, any>;
    eamAssetList:             string[];
    eamLocations:             Map<string, any>;
    eamLocationList:          string[];
    eamMaintenancePlans:      Map<string, any>;
    eamMaintenancePlanList:   string[];
    assetsByWorkCenter:       Map<string, string[]>;

    // ERP master data
    erpCompanies:             Map<string, any>;
    erpCurrencies:            any[];
    erpGlAccounts:            Map<string, any>;
    erpGlAccountList:         string[];
    erpCostCenters:           Map<string, any>;
    erpCostCenterList:        string[];
    erpCustomers:             Map<string, any>;
    erpCustomerList:          string[];
    erpSuppliers:             Map<string, any>;
    erpSupplierList:          string[];
    erpItems:                 Map<string, any>;
    erpItemList:              string[];

    // WMS master data
    wmsWarehouses:            Map<string, any>;
    wmsLocations:             Map<string, any>;
    wmsLocationList:          string[];
    wmsLocationsByWarehouse:  Map<string, string[]>;

    // APS master data
    apsPlans:                 Map<string, any>;
    apsPlanList:              string[];
    apsScenarios:             Map<string, any>;
    apsScenarioList:          string[];
    apsResources:             Map<string, any>;
    apsResourceList:          string[];
};

// ---------------------------------------------------------------------------
// generateEntities
// ---------------------------------------------------------------------------

export function generateEntities(config: GeneratorConfig, rng: RNG): Phase1Result {
    const { site, siteId } = config;
    const now = new Date().toISOString();

    const windowStart = new Date(config.now);
    windowStart.setMonth(windowStart.getMonth() - config.monthsBack);

    const prodLocations = getProductionLocations(site);

    // ---- PO Templates (one per production location) ----
    const poTemplates = new Map<string, POTemplate>();
    for (const loc of prodLocations) {
        const ops: OperationTemplate[] = loc.workCenters.map(wc => ({
            operationType:  wc.tags["operationType"] ?? "GENERAL",
            setupMinutes:   DEFAULT_SETUP_MINUTES[wc.tags["operationType"] ?? ""] ?? 15,
            workCenterId:   wc.hash,
            workCenterName: wc.name,
        }));
        const opTypeKey = ops.map(o => o.operationType).sort().join(",");
        const fgInfo = FG_BY_OP_TYPES[opTypeKey] ?? { name: `Product-${loc.name}`, cost: 800 };
        poTemplates.set(loc.hash, {
            locationId:   loc.hash,
            locationName: loc.name,
            itemId:       `FG-${loc.hash}`,
            operations:   ops,
        });
        void fgInfo; // used below for items
    }

    // ---- Structural: EAM locations, assets, MES work centers ----
    const eamLocations          = new Map<string, any>();
    const eamLocationList:       string[] = [];
    const eamAssets              = new Map<string, any>();
    const eamAssetList:          string[] = [];
    const eamMaintenancePlans    = new Map<string, any>();
    const eamMaintenancePlanList: string[] = [];
    const assetsByWorkCenter     = new Map<string, string[]>();
    const workCenters            = new Map<string, any>();
    const workCenterList:        string[] = [];
    const maintenancePlanTemplates: MaintenancePlanTemplate[] = [];

    // Site-level EAM location
    eamLocations.set(site.hash, {
        id: site.hash, locationCode: site.name, name: prettify(site.name),
        description: `Plant ${site.name}`, siteCode: siteId,
        parentLocationId: null, status: "active", createdAt: now, updatedAt: now,
    });
    eamLocationList.push(site.hash);

    for (const loc of site.locations) {
        // EAM location for the area
        eamLocations.set(loc.hash, {
            id: loc.hash, locationCode: loc.name, name: prettify(loc.name),
            description: `${prettify(loc.name)} area`, siteCode: siteId,
            parentLocationId: site.hash, status: "active", createdAt: now, updatedAt: now,
        });
        eamLocationList.push(loc.hash);

        for (const wc of loc.workCenters) {
            const opType      = wc.tags["operationType"] ?? "GENERAL";
            const criticality = opType === "MACHINING" ? "high" : opType === "ASSEMBLY" ? "medium" : "low";

            // EAM location for the work center
            eamLocations.set(wc.hash, {
                id: wc.hash, locationCode: wc.name, name: prettify(wc.name),
                description: `Work center ${wc.name} (${opType})`, siteCode: siteId,
                parentLocationId: loc.hash, status: "active", createdAt: now, updatedAt: now,
            });
            eamLocationList.push(wc.hash);

            // MES work center
            workCenters.set(wc.hash, {
                id: wc.hash, siteId, code: wc.name, name: prettify(wc.name),
                locationCode: loc.name, status: "idle",
                activeProductionOrderId: null, activeOperationId: null,
                utilizationPercent: 0, queueLength: 0,
                runtimeMinutes: 0, downtimeMinutes: 0,
                goodQuantity: 0, scrapQuantity: 0,
                operationType: opType, criticality,
            });
            workCenterList.push(wc.hash);

            // Machines → EAM assets + maintenance plan templates
            // If the work center has no machines in the scene, synthesise one so that
            // PM plans and work orders are still generated for this location.
            const syntheticMachine = wc.machines.length === 0
                ? [{ hash: `syn-${wc.hash}`, name: wc.name }]
                : [];
            const machineIds: string[] = [];
            for (const machine of [...wc.machines, ...syntheticMachine]) {
                // EAM location for the machine itself
                eamLocations.set(machine.hash, {
                    id: machine.hash, locationCode: machine.name, name: prettify(machine.name),
                    description: `Machine ${machine.name}`, siteCode: siteId,
                    parentLocationId: wc.hash, status: "active", createdAt: now, updatedAt: now,
                });
                eamLocationList.push(machine.hash);

                // EAM asset
                const installDate = new Date(config.now);
                installDate.setFullYear(installDate.getFullYear() - rng.nextInt(2, 8));
                const models = MACHINE_MODELS[opType] ?? MACHINE_MODELS["DEFAULT"];
                eamAssets.set(machine.hash, {
                    id:           machine.hash,
                    assetNumber:  machine.name,
                    name:         prettify(machine.name),
                    description:  `${prettify(opType.replace(/_/g, " "))} machine`,
                    assetType:    opType.toLowerCase(),
                    status:       "operational",
                    locationId:   machine.hash,
                    workCenterId: wc.hash,
                    criticality,
                    manufacturer: rng.pick(MANUFACTURERS),
                    model:        rng.pick(models),
                    serialNumber: `SN-${machine.hash.toUpperCase()}`,
                    installDate:  Math.floor(installDate.getTime() / 1000),
                });
                eamAssetList.push(machine.hash);
                machineIds.push(machine.hash);

                // Maintenance plan
                const planId = `MP-${machine.hash}`;

                // Initialise nextDue: stagger machines so they don't all come due simultaneously
                const offset = rng.nextInt(0, config.pmFrequencyDays - 1);
                let nextDue = new Date(windowStart);
                nextDue = addDays(nextDue, offset);
                // Ensure nextDue is in the future relative to windowStart
                while (nextDue < windowStart) {
                    nextDue = addDays(nextDue, config.pmFrequencyDays);
                }

                eamMaintenancePlans.set(planId, {
                    id:                     planId,
                    name:                   `PM Plan – ${prettify(machine.name)}`,
                    assetId:                machine.hash,
                    planType:               "predictive",
                    description:            "Predictive maintenance – periodic inspection and service",
                    frequencyDays:          config.pmFrequencyDays,
                    estimatedDurationHours: config.pmDurationHours,
                    status:                 "active",
                    createdAt:              now,
                });
                eamMaintenancePlanList.push(planId);

                maintenancePlanTemplates.push({
                    planId,
                    assetId:         machine.hash,
                    assetName:       machine.name,
                    workCenterId:    wc.hash,
                    locationId:      loc.hash,
                    frequencyDays:   config.pmFrequencyDays,
                    pmDurationHours: config.pmDurationHours,
                    nextDue:         new Date(nextDue),
                });
            }
            assetsByWorkCenter.set(wc.hash, machineIds);
        }
    }

    // ---- ERP master data ----
    const companyId = "COMP-001";

    const erpCompanies = new Map<string, any>();
    erpCompanies.set(companyId, {
        id: companyId, code: companyId,
        name: "Acme Manufacturing Inc.",
        currency: "USD", country: "USA",
        status: "active", fiscalYearStart: "01-01",
    });

    const erpCurrencies: any[] = [
        { code: "USD", name: "US Dollar", symbol: "$", isReporting: true  },
        { code: "EUR", name: "Euro",       symbol: "€", isReporting: false },
    ];

    const GL_DEFS = [
        { id: "GL-1000", code: "1000", name: "Cash",               type: "asset"     },
        { id: "GL-1100", code: "1100", name: "Accounts Receivable", type: "asset"     },
        { id: "GL-1200", code: "1200", name: "Inventory",           type: "asset"     },
        { id: "GL-2000", code: "2000", name: "Accounts Payable",    type: "liability" },
        { id: "GL-3000", code: "3000", name: "Revenue",             type: "revenue"   },
        { id: "GL-4000", code: "4000", name: "Cost of Goods Sold",  type: "expense"   },
    ];
    const erpGlAccounts    = new Map<string, any>();
    const erpGlAccountList: string[] = [];
    for (const gl of GL_DEFS) {
        erpGlAccounts.set(gl.id, { ...gl, companyId, status: "active" });
        erpGlAccountList.push(gl.id);
    }

    // Cost centers — one per location + one overhead
    const erpCostCenters    = new Map<string, any>();
    const erpCostCenterList: string[] = [];
    for (const loc of site.locations) {
        const ccId = `CC-${loc.hash}`;
        erpCostCenters.set(ccId, {
            id: ccId, companyId, code: loc.name,
            name: prettify(loc.name), manager: "Plant Manager", status: "active",
        });
        erpCostCenterList.push(ccId);
    }
    erpCostCenters.set("CC-OVERHEAD", {
        id: "CC-OVERHEAD", companyId, code: "OVERHEAD",
        name: "Overhead", manager: "Finance Controller", status: "active",
    });
    erpCostCenterList.push("CC-OVERHEAD");

    // Customers
    const erpCustomers    = new Map<string, any>();
    const erpCustomerList: string[] = [];
    for (let i = 0; i < Math.min(config.customerCount, CUSTOMER_POOL.length); i++) {
        const c = CUSTOMER_POOL[i];
        erpCustomers.set(c.code, { ...c, id: c.code, companyId, status: "active", currency: "USD" });
        erpCustomerList.push(c.code);
    }

    // Suppliers
    const erpSuppliers    = new Map<string, any>();
    const erpSupplierList: string[] = [];
    for (let i = 0; i < Math.min(config.supplierCount, SUPPLIER_POOL.length); i++) {
        const s = SUPPLIER_POOL[i];
        erpSuppliers.set(s.code, { ...s, id: s.code, companyId, status: "active", currency: "USD" });
        erpSupplierList.push(s.code);
    }

    // Items — one finished good per production location + raw materials
    const erpItems    = new Map<string, any>();
    const erpItemList: string[] = [];
    for (const loc of prodLocations) {
        const tmpl     = poTemplates.get(loc.hash)!;
        const opTypeKey = tmpl.operations.map(o => o.operationType).sort().join(",");
        const fgInfo   = FG_BY_OP_TYPES[opTypeKey] ?? { name: `Product-${loc.name}`, cost: 800 };
        erpItems.set(tmpl.itemId, {
            id: tmpl.itemId, itemNumber: tmpl.itemId,
            name: fgInfo.name,
            description: `${fgInfo.name} — ${prettify(loc.name)}`,
            itemType: "finished_good", uom: "pcs",
            standardCost: fgInfo.cost, currency: "USD", status: "active",
        });
        erpItemList.push(tmpl.itemId);
    }
    for (const rm of RAW_MATERIALS) {
        erpItems.set(rm.id, {
            id: rm.id, itemNumber: rm.id, name: rm.name,
            description: rm.name, itemType: "raw_material",
            uom: rm.uom, standardCost: rm.cost, currency: "USD", status: "active",
        });
        erpItemList.push(rm.id);
    }

    // ---- WMS master data ----
    const wmsWarehouses          = new Map<string, any>();
    const wmsLocations           = new Map<string, any>();
    const wmsLocationList:        string[] = [];
    const wmsLocationsByWarehouse = new Map<string, string[]>();

    for (const wh of [
        { id: "WH-RM", name: "Raw Material Store",   type: "raw_material"   },
        { id: "WH-FG", name: "Finished Goods Store", type: "finished_goods" },
    ]) {
        wmsWarehouses.set(wh.id, { ...wh, code: wh.id, siteId, status: "active" });
        const bins: string[] = [];
        for (let b = 1; b <= 4; b++) {
            const locId = `${wh.id}-BIN-${String(b).padStart(2, "0")}`;
            wmsLocations.set(locId, {
                id: locId, warehouseId: wh.id,
                code: locId, name: `Bin ${b}`, type: "bin", status: "active",
            });
            wmsLocationList.push(locId);
            bins.push(locId);
        }
        wmsLocationsByWarehouse.set(wh.id, bins);
    }

    // ---- APS master data ----
    const planId     = `APS-PLAN-${siteId}`;
    const scenarioId = "APS-SCN-BASE";

    const apsPlans     = new Map<string, any>();
    const apsPlanList:  string[] = [];
    const apsScenarios  = new Map<string, any>();
    const apsScenarioList: string[] = [];
    const apsResources  = new Map<string, any>();
    const apsResourceList: string[] = [];

    apsPlans.set(planId, {
        id: planId, name: `Production Plan – ${siteId}`, siteId,
        status: "active",
        planningHorizonDays: (config.monthsBack + config.monthsForward) * 30,
    });
    apsPlanList.push(planId);

    apsScenarios.set(scenarioId, {
        id: scenarioId, planId, name: "Baseline", type: "baseline", status: "active",
    });
    apsScenarioList.push(scenarioId);

    for (const wc of flattenWorkCenters(site)) {
        const opType = wc.tags["operationType"] ?? "GENERAL";
        apsResources.set(wc.hash, {
            id: wc.hash, code: wc.name, name: prettify(wc.name),
            type: "work_center", planId,
            finiteCapacity: true, maxConcurrentOperations: 1,
            schedulingPolicy: "forward",
            operationType: opType,
        });
        apsResourceList.push(wc.hash);
    }

    return {
        poTemplates,
        downtimeTemplates:        DOWNTIME_POOL,
        maintenancePlanTemplates,
        workCenters,
        workCenterList,
        eamAssets,
        eamAssetList,
        eamLocations,
        eamLocationList,
        eamMaintenancePlans,
        eamMaintenancePlanList,
        assetsByWorkCenter,
        erpCompanies,
        erpCurrencies,
        erpGlAccounts,
        erpGlAccountList,
        erpCostCenters,
        erpCostCenterList,
        erpCustomers,
        erpCustomerList,
        erpSuppliers,
        erpSupplierList,
        erpItems,
        erpItemList,
        wmsWarehouses,
        wmsLocations,
        wmsLocationList,
        wmsLocationsByWarehouse,
        apsPlans,
        apsPlanList,
        apsScenarios,
        apsScenarioList,
        apsResources,
        apsResourceList,
    };
}
