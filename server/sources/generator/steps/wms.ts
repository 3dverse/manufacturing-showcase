import type { GeneratorConfig } from "../types";
import type { RNG } from "../rng";

const toUnix = (d: Date): number => Math.floor(d.getTime() / 1000);

function addDays(d: Date, n: number): Date {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
}

export function generateWMS(
    config: GeneratorConfig,
    _structural: any,
    erp: any,
    mes: any,
    rng: RNG,
): any {
    const { now, monthsBack, items } = config;
    const windowStart = addDays(now, -monthsBack * 30);

    const warehouseId = "WH-PLANT-01";
    const warehouses = new Map<string, any>();
    const locations = new Map<string, any>();
    const locationList: string[] = [];
    const locationsByWarehouse = new Map<string, string[]>([[warehouseId, []]]);

    const inventoryPositions: any[] = [];
    const inventoryByItem = new Map<string, any[]>();
    const inventorySummary: any[] = [];
    const handlingUnits: any[] = [];
    const lotStock: any[] = [];
    const serialStock: any[] = [];
    const receipts: any[] = [];
    const putawayTasks: any[] = [];
    const pickTasks: any[] = [];
    const shipments: any[] = [];
    const cycleCounts: any[] = [];
    const inventoryMovements: any[] = [];

    let locNum = 1;
    let huNum = 1;
    let lotNum = 1;
    let receiptNum = 1;
    let putNum = 1;
    let pickNum = 1;
    let shipNum = 1;
    let ccNum = 1;
    let mvtNum = 1;

    // --- Warehouse ---
    warehouses.set(warehouseId, {
        id: warehouseId,
        code: "WH-PLANT-01",
        name: "Plant 01 Main Warehouse",
        status: "active",
        timezone: config.shifts.timezone,
        address: {
            line1: "1 Industrial Pkwy",
            line2: null,
            city: "Toronto",
            state: "ON",
            postalCode: "M5V 3L9",
            country: "CA",
        },
    });

    function addLoc(code: string, name: string, zone: string, locType: string, aisle?: string, bay?: string, level?: string): string {
        const id = `LOC-${String(locNum).padStart(5, "0")}`;
        locNum++;
        const loc = {
            id,
            warehouseId,
            code,
            name,
            zone,
            aisle: aisle ?? null,
            bay: bay ?? null,
            level: level ?? null,
            position: null,
            locationType: locType,
            status: "active",
            capacityUom: "PLT",
            capacityValue: 4,
        };
        locations.set(id, loc);
        locationList.push(id);
        locationsByWarehouse.get(warehouseId)!.push(id);
        return id;
    }

    // RECEIVING zone: 4 dock locations
    const receivingLocs: string[] = [];
    for (let d = 1; d <= 4; d++) {
        receivingLocs.push(addLoc(`DOCK-0${d}`, `Receiving Dock ${d}`, "RECEIVING", "DOCK"));
    }

    // STORAGE zone: 3 aisles × 5 bays × 3 levels = 45 bins
    const storageLocs: string[] = [];
    for (const aisle of ["A", "B", "C"]) {
        for (let bay = 1; bay <= 5; bay++) {
            for (let level = 1; level <= 3; level++) {
                const code = `${aisle}${String(bay).padStart(2, "0")}-L${level}`;
                storageLocs.push(addLoc(code, `Aisle ${aisle} Bay ${bay} Level ${level}`, "STORAGE", "RESERVE", aisle, String(bay), String(level)));
            }
        }
    }

    // STAGING zone: 6 staging lanes
    const stagingLocs: string[] = [];
    for (let s = 1; s <= 6; s++) {
        stagingLocs.push(addLoc(`STAGE-0${s}`, `Staging Lane ${s}`, "STAGING", "STAGING"));
    }

    // QUARANTINE zone: 2 locations
    const quarantineLocs: string[] = [];
    for (let q = 1; q <= 2; q++) {
        quarantineLocs.push(addLoc(`QUAR-0${q}`, `Quarantine Zone ${q}`, "QUARANTINE", "QUARANTINE"));
    }

    const rawMaterials = items.filter((i) => i.itemType === "raw_material");

    // --- Inventory ---
    for (const item of rawMaterials) {
        const numBins = rng.nextInt(3, 8);
        const binLocs = rng.shuffle([...storageLocs]).slice(0, numBins);
        let totalOnHand = 0;
        const positions: any[] = [];

        for (const locId of binLocs) {
            const lotNumber = `LOT-${item.id}-${String(lotNum).padStart(4, "0")}`;
            lotNum++;
            const onHand = rng.nextInt(100, 800);
            const allocated = Math.round(onHand * rng.nextFloat(0.1, 0.4));
            const available = onHand - allocated;
            const expirationDate = rng.bool(0.3) ? toUnix(addDays(now, rng.nextInt(-30, 180))) : null;

            const huId = `HU-${String(huNum).padStart(6, "0")}`;
            huNum++;
            handlingUnits.push({
                id: huId,
                warehouseId,
                type: "PALLET",
                status: "in_storage",
                locationId: locId,
                parentHandlingUnitId: null,
                itemCount: 1,
                quantityOnHand: onHand,
            });

            const pos = {
                warehouseId,
                locationId: locId,
                itemId: item.id,
                lotNumber,
                serialNumber: null,
                handlingUnitId: huId,
                quantityOnHand: onHand,
                quantityAllocated: allocated,
                quantityAvailable: available,
                uom: item.uom,
                inventoryStatus: "unrestricted",
                lastMovementAt: toUnix(addDays(now, -rng.nextInt(1, 30))),
            };
            positions.push(pos);
            inventoryPositions.push(pos);
            totalOnHand += onHand;

            lotStock.push({
                lotNumber,
                itemId: item.id,
                warehouseId,
                expirationDate,
                quantityOnHand: onHand,
                uom: item.uom,
            });
        }

        if (!inventoryByItem.has(item.id)) inventoryByItem.set(item.id, []);
        inventoryByItem.get(item.id)!.push(...positions);

        const totalAllocated = positions.reduce((s, p) => s + p.quantityAllocated, 0);
        inventorySummary.push({
            warehouseId,
            itemId: item.id,
            quantityOnHand: totalOnHand,
            quantityAllocated: totalAllocated,
            quantityAvailable: totalOnHand - totalAllocated,
            uom: item.uom,
        });
    }

    // --- Receipts from received POs ---
    for (const po of erp.purchaseOrderList) {
        if (po.status !== "received" && po.status !== "partially_received") continue;

        const rcptId = `RCT-${String(receiptNum).padStart(6, "0")}`;
        receiptNum++;
        // po.orderDate is now unix timestamp
        const receivedAt = addDays(new Date(po.orderDate * 1000), rng.nextInt(7, 21));
        const dockLoc = rng.pick(receivingLocs);
        const isCompleted = receivedAt < now;

        receipts.push({
            id: rcptId,
            warehouseId,
            receiptNumber: rcptId,
            status: isCompleted ? "completed" : "in_progress",
            receivedAt: toUnix(receivedAt),
            dockLocationId: dockLoc,
            lineCount: po.lines.length,
            erpPurchaseOrderId: po.id,
        });

        // Receipt inventory movement
        if (isCompleted) {
            for (const line of po.lines) {
                const mvtId = `MVT-${String(mvtNum).padStart(8, "0")}`;
                mvtNum++;
                inventoryMovements.push({
                    id: mvtId,
                    warehouseId,
                    occurredAt: toUnix(receivedAt),
                    movementType: "receipt",
                    itemId: line.itemId,
                    lotNumber: null,
                    serialNumber: null,
                    quantity: line.orderedQuantity,
                    uom: line.uom,
                    fromLocationId: null,
                    toLocationId: dockLoc,
                    sourceDocumentType: "purchase_order",
                    sourceDocumentId: rcptId,
                    erpPurchaseOrderId: po.id,
                    erpSalesOrderId: null,
                });
            }
        }

        // Putaway tasks + movements
        for (const line of po.lines) {
            const putId = `PUT-${String(putNum).padStart(6, "0")}`;
            putNum++;
            const destLoc = rng.pick(storageLocs);
            const putStatus = isCompleted ? "completed" : "pending";
            putawayTasks.push({
                id: putId,
                warehouseId,
                status: putStatus,
                itemId: line.itemId,
                quantity: line.orderedQuantity,
                uom: line.uom,
                sourceLocationId: dockLoc,
                destinationLocationId: destLoc,
                createdAt: toUnix(receivedAt),
            });

            if (isCompleted) {
                const putTime = addDays(receivedAt, 0);
                putTime.setTime(putTime.getTime() + rng.nextFloat(0.5, 4) * 3600000);
                const mvtId = `MVT-${String(mvtNum).padStart(8, "0")}`;
                mvtNum++;
                inventoryMovements.push({
                    id: mvtId,
                    warehouseId,
                    occurredAt: toUnix(putTime),
                    movementType: "putaway",
                    itemId: line.itemId,
                    lotNumber: null,
                    serialNumber: null,
                    quantity: line.orderedQuantity,
                    uom: line.uom,
                    fromLocationId: dockLoc,
                    toLocationId: destLoc,
                    sourceDocumentType: "purchase_order",
                    sourceDocumentId: putId,
                    erpPurchaseOrderId: po.id,
                    erpSalesOrderId: null,
                });
            }
        }
    }

    // --- Pick Tasks from production orders ---
    let pickOpCount = 0;
    for (const opId of mes.operationList.slice(0, 200)) {
        const op = mes.operations.get(opId);
        if (!op || op.status === "ready") continue;

        const po = mes.productionOrders.get(op.productionOrderId);
        if (!po) continue;
        const item = items.find((i) => i.id === po.itemCode);
        if (!item) continue;

        for (const component of item.components) {
            const pickId = `PCK-${String(pickNum).padStart(6, "0")}`;
            pickNum++;
            const srcLoc = rng.pick(storageLocs);
            const stageLoc = rng.pick(stagingLocs);
            const pickStatus = op.status === "completed" ? "completed" : "pending";
            // op.actualStart is now a unix timestamp (or null)
            const pickCreatedAt = op.actualStart ?? op.scheduledStart;
            pickTasks.push({
                id: pickId,
                warehouseId,
                status: pickStatus,
                itemId: component.itemId,
                quantity: component.quantity * po.quantities.plannedQuantity,
                uom: component.uom,
                sourceLocationId: srcLoc,
                destinationLocationId: stageLoc,
                shipmentId: null,
                createdAt: pickCreatedAt,
            });

            if (pickStatus === "completed") {
                const pickTime = new Date((pickCreatedAt as number) * 1000);
                pickTime.setTime(pickTime.getTime() + rng.nextFloat(0.25, 2) * 3600000);
                const mvtId = `MVT-${String(mvtNum).padStart(8, "0")}`;
                mvtNum++;
                inventoryMovements.push({
                    id: mvtId,
                    warehouseId,
                    occurredAt: toUnix(pickTime),
                    movementType: "pick",
                    itemId: component.itemId,
                    lotNumber: null,
                    serialNumber: null,
                    quantity: component.quantity * po.quantities.plannedQuantity,
                    uom: component.uom,
                    fromLocationId: srcLoc,
                    toLocationId: stageLoc,
                    sourceDocumentType: "production_order",
                    sourceDocumentId: pickId,
                    erpPurchaseOrderId: null,
                    erpSalesOrderId: po.erpSalesOrderId ?? null,
                });
            }
        }
        pickOpCount++;
        if (pickOpCount > 100) break;
    }

    // --- Shipments from fulfilled SOs ---
    for (const so of erp.salesOrderList) {
        if (so.status !== "fulfilled" && so.status !== "invoiced") continue;

        const shipId = `SHP-${String(shipNum).padStart(6, "0")}`;
        shipNum++;
        // so.requestedDeliveryDate is now a unix timestamp
        const shipDate = addDays(new Date(so.requestedDeliveryDate * 1000), rng.nextInt(-1, 2));
        const stageLoc = rng.pick(stagingLocs);
        const isShipped = shipDate < now;

        shipments.push({
            id: shipId,
            warehouseId,
            shipmentNumber: shipId,
            status: isShipped ? "shipped" : "staging",
            shipDate: toUnix(shipDate),
            stagingLocationId: stageLoc,
            lineCount: so.lines.length,
            erpSalesOrderId: so.id,
        });

        // Shipment inventory movement
        if (isShipped) {
            for (const line of so.lines) {
                const mvtId = `MVT-${String(mvtNum).padStart(8, "0")}`;
                mvtNum++;
                inventoryMovements.push({
                    id: mvtId,
                    warehouseId,
                    occurredAt: toUnix(shipDate),
                    movementType: "shipment",
                    itemId: line.itemId,
                    lotNumber: null,
                    serialNumber: null,
                    quantity: line.orderedQuantity,
                    uom: line.uom,
                    fromLocationId: stageLoc,
                    toLocationId: null,
                    sourceDocumentType: "sales_order",
                    sourceDocumentId: shipId,
                    erpPurchaseOrderId: null,
                    erpSalesOrderId: so.id,
                });
            }
        }
    }

    // --- Cycle Counts: 2 per month ---
    let ccCursor = new Date(windowStart);
    while (ccCursor <= now) {
        for (let wk = 0; wk < 2; wk++) {
            const ccDate = addDays(ccCursor, wk * 14 + rng.nextInt(0, 5));
            if (ccDate > now) continue;

            const ccId = `CC-${String(ccNum).padStart(5, "0")}`;
            ccNum++;
            const isCompleted = ccDate < addDays(now, -3);
            const completedAt = isCompleted ? addDays(ccDate, 1) : null;
            cycleCounts.push({
                id: ccId,
                warehouseId,
                status: isCompleted ? "completed" : "scheduled",
                countType: rng.pick(["CYCLE", "CYCLE", "LOCATION", "ITEM"]),
                scheduledDate: toUnix(ccDate),
                completedAt: completedAt ? toUnix(completedAt) : null,
                varianceLineCount: isCompleted ? rng.nextInt(0, 5) : 0,
            });
        }
        ccCursor = addDays(ccCursor, 30);
    }

    // Sort movements chronologically
    inventoryMovements.sort((a, b) => a.occurredAt - b.occurredAt);

    return {
        warehouses,
        locations,
        locationList,
        locationsByWarehouse,
        inventoryPositions,
        inventoryByItem,
        inventorySummary,
        handlingUnits,
        lotStock,
        serialStock,
        receipts,
        putawayTasks,
        pickTasks,
        shipments,
        cycleCounts,
        inventoryMovements,
    };
}
