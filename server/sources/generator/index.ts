import { createRng } from "./rng";
import type { GeneratorConfig, Dataset } from "./types";
import { generateStructural } from "./steps/structural";
import { generateERP } from "./steps/erp";
import { generateAPS } from "./steps/aps";
import { generateMES } from "./steps/mes";
import { generateEAM } from "./steps/eam";
import { generateQMS } from "./steps/qms";
import { generateWMS } from "./steps/wms";
import { getLocationForMachine } from "./graph";

function applyScenarios(scenarios: GeneratorConfig["scenarios"], mes: any): void {
    for (const scenario of scenarios) {
        if (scenario.type === "machine_breakdown") {
            // Mark target work center as down
            const wc = mes.workCenters.get(scenario.targetId);
            if (wc) {
                wc.status = "down";
                wc.activeProductionOrderId = null;
                wc.activeOperationId = null;
            }
        } else if (scenario.type === "material_shortage") {
            // Could affect dispatch items — mark as blocked
            for (const item of mes.dispatchItems) {
                if (item.workCenterId === scenario.targetId) {
                    item.status = "blocked";
                }
            }
        }
    }
}

export function generateDataset(config: GeneratorConfig): Dataset {
    console.log(`[Generator] Starting dataset generation (seed=${config.seed}, now=${config.now.toISOString()})`);
    const startTime = Date.now();

    const rng = createRng(config.seed);
    if (!config.siteId) throw new Error("[Generator] config.siteId is required");
    const siteId = config.siteId;

    // Step 1: Structural
    console.log("[Generator] Step 1: Structural...");
    const structural = generateStructural(config.site, siteId, rng);

    // Step 2: ERP
    console.log("[Generator] Step 2: ERP...");
    const erp = generateERP(config, structural, rng);

    // Step 3: APS
    console.log("[Generator] Step 3: APS...");
    const aps = generateAPS(config, structural, erp, rng);

    // Step 4: EAM assets + plans
    console.log("[Generator] Step 4: EAM...");
    const eam = generateEAM(
        config,
        {
            eamLocations: structural.eamLocations,
            eamLocationList: structural.eamLocationList,
            assetsByWorkCenter: structural.assetsByWorkCenter,
        },
        rng,
    );

    // Step 5: MES execution
    console.log("[Generator] Step 5: MES...");
    const mes = generateMES(config, structural, aps, eam, rng);

    // Step 6: QMS
    console.log("[Generator] Step 6: QMS...");
    const qms = generateQMS(config, mes, erp, rng);

    // Step 7: WMS
    console.log("[Generator] Step 7: WMS...");
    const wms = generateWMS(config, structural, erp, mes, rng);

    // Step 8: Post-process APS scheduled operations with MES production order IDs
    console.log("[Generator] Post-processing APS ↔ MES links...");
    for (const poId of mes.productionOrderList) {
        const po = mes.productionOrders.get(poId);
        if (!po?._supplyId) continue;
        const supply = aps.supplies.get(po._supplyId);
        if (!supply) continue;
        for (const scOpId of supply._opIds as string[]) {
            const scOp = aps.scheduledOperations.get(scOpId);
            if (scOp) scOp.mesProductionOrderId = poId;
        }
    }

    // Step 9: Link EAM corrective WOs to the MES PO they fall within
    console.log("[Generator] Post-processing EAM ↔ MES links...");
    for (const woId of eam.workOrderList) {
        const wo = eam.workOrders.get(woId);
        if (!wo || wo.workType !== "corrective") continue;
        const woStart: number = wo.actualStart ?? wo.scheduledStart;

        // Find the MES production location for this machine
        const machineLocation = getLocationForMachine(config.site, wo.assetId);
        if (!machineLocation) continue;

        const poIds: string[] = mes.productionOrdersByLocation.get(machineLocation.hash) ?? [];
        for (const poId of poIds) {
            const po = mes.productionOrders.get(poId);
            if (!po) continue;
            if (woStart >= po.timing.scheduledStart && woStart <= po.timing.scheduledEnd) {
                wo.mesProductionOrderId = poId;
                break;
            }
        }
    }

    // Step 10: Apply scenario overlays
    if (config.scenarios.length > 0) {
        console.log("[Generator] Applying scenario overlays...");
        applyScenarios(config.scenarios, mes);
    }

    const elapsed = Date.now() - startTime;
    console.log(
        `[Generator] Done in ${elapsed}ms. ` +
        `POs=${mes.productionOrderList.length}, Ops=${mes.operationList.length}, ` +
        `Events=${mes.productionEvents.length}, OEEBuckets=${mes.oeeTimeseries.length}`,
    );

    return {
        siteId,
        now: config.now,
        erp: {
            companies: erp.companies,
            currencies: erp.currencies,
            fiscalPeriods: erp.fiscalPeriods,
            glAccounts: erp.glAccounts,
            costCenters: erp.costCenters,
            customers: erp.customers,
            suppliers: erp.suppliers,
            items: erp.items,
            salesOrders: erp.salesOrders,
            purchaseOrders: erp.purchaseOrders,
            invoices: erp.invoices,
            payments: erp.payments,
            journalEntries: erp.journalEntries,
            salesOrderList: erp.salesOrderList,
            purchaseOrderList: erp.purchaseOrderList,
            invoiceList: erp.invoiceList,
            paymentList: erp.paymentList,
            journalEntryList: erp.journalEntryList,
            glAccountList: erp.glAccountList,
            costCenterList: erp.costCenterList,
            customerList: erp.customerList,
            supplierList: erp.supplierList,
            itemList: erp.itemList,
        },
        aps: {
            plans: aps.plans,
            planList: aps.planList,
            scenarios: aps.scenarios,
            scenarioList: aps.scenarioList,
            resources: aps.resources,
            resourceList: aps.resourceList,
            scheduledOperations: aps.scheduledOperations,
            scheduledOperationsByPlan: aps.scheduledOperationsByPlan,
            scheduledOperationsByResource: aps.scheduledOperationsByResource,
            capacityBuckets: aps.capacityBuckets,
            capacityBucketsByPlan: aps.capacityBucketsByPlan,
            materialAvailability: aps.materialAvailability,
            materialAvailabilityByPlan: aps.materialAvailabilityByPlan,
            exceptions: aps.exceptions,
            kpis: aps.kpis,
            demands: aps.demands,
            demandList: aps.demandList,
            supplies: aps.supplies,
            supplyList: aps.supplyList,
            pegging: aps.pegging,
            constraints: aps.constraints,
            resourceLoad: aps.resourceLoad,
        },
        mes: {
            workCenters: mes.workCenters,
            workCenterList: mes.workCenterList,
            productionOrders: mes.productionOrders,
            productionOrderList: mes.productionOrderList,
            operations: mes.operations,
            operationList: mes.operationList,
            dispatchItems: mes.dispatchItems,
            productionEvents: mes.productionEvents,
            downtimeEvents: mes.downtimeEvents,
            oeeTimeseries: mes.oeeTimeseries,
            operationsByProductionOrder: mes.operationsByProductionOrder,
            operationsByWorkCenter: mes.operationsByWorkCenter,
            productionOrdersByLocation: mes.productionOrdersByLocation,
            productionEventsByOperation: mes.productionEventsByOperation,
            productionEventsByProductionOrder: mes.productionEventsByProductionOrder,
            productionEventsByWorkCenter: mes.productionEventsByWorkCenter,
            downtimeByWorkCenter: mes.downtimeByWorkCenter,
            oeeByWorkCenter: mes.oeeByWorkCenter,
            workCenterTimelines: mes.workCenterTimelines,
        },
        eam: {
            assets: eam.assets,
            assetList: eam.assetList,
            locations: eam.locations,
            locationList: eam.locationList,
            workOrders: eam.workOrders,
            workOrderList: eam.workOrderList,
            workOrderOperations: eam.workOrderOperations,
            maintenancePlans: eam.maintenancePlans,
            maintenancePlanList: eam.maintenancePlanList,
            maintenanceSchedules: eam.maintenanceSchedules,
            serviceRequests: eam.serviceRequests,
            serviceRequestList: eam.serviceRequestList,
            inspections: eam.inspections,
            inspectionList: eam.inspectionList,
            assetHistory: eam.assetHistory,
            workOrdersByAsset: eam.workOrdersByAsset,
            workOrdersByLocation: eam.workOrdersByLocation,
            assetsByLocation: eam.assetsByLocation,
            maintenancePlansByAsset: eam.maintenancePlansByAsset,
            inspectionsByAsset: eam.inspectionsByAsset,
            serviceRequestsByAsset: eam.serviceRequestsByAsset,
        },
        qms: {
            nonconformances: qms.nonconformances,
            nonconformanceList: qms.nonconformanceList,
            capas: qms.capas,
            capaList: qms.capaList,
            deviations: qms.deviations,
            deviationList: qms.deviationList,
            audits: qms.audits,
            auditList: qms.auditList,
            complaints: qms.complaints,
            complaintList: qms.complaintList,
            documents: qms.documents,
            documentList: qms.documentList,
        },
        wms: {
            warehouses: wms.warehouses,
            locations: wms.locations,
            locationList: wms.locationList,
            locationsByWarehouse: wms.locationsByWarehouse,
            inventoryPositions: wms.inventoryPositions,
            inventoryByItem: wms.inventoryByItem,
            inventorySummary: wms.inventorySummary,
            handlingUnits: wms.handlingUnits,
            lotStock: wms.lotStock,
            serialStock: wms.serialStock,
            receipts: wms.receipts,
            putawayTasks: wms.putawayTasks,
            pickTasks: wms.pickTasks,
            shipments: wms.shipments,
            cycleCounts: wms.cycleCounts,
            inventoryMovements: wms.inventoryMovements,
        },
    };
}
