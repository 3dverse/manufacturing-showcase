/**
 * Standalone generator smoke test.
 * Run with:  npx tsx server/sources/generator/test-generate.ts
 */

import { generate } from "./index";
import { mockSite } from "./mock-site";

const ds = generate({ site: mockSite, siteId: "mock-site" });

// ---- MES ----
console.log("\n=== MES ===");
console.log(`Production orders : ${ds.mes.productionOrderList.length}`);
console.log(`Operations        : ${ds.mes.operationList.length}`);
console.log(`Routings          : ${ds.mes.routingList.length}`);

const sampleOp = [...ds.mes.operations.values()][0] as any;
console.log("\nSample operation inputs :", JSON.stringify(sampleOp?.inputs,  null, 2));
console.log("Sample operation outputs:", JSON.stringify(sampleOp?.outputs, null, 2));

// ---- WMS ----
console.log("\n=== WMS ===");
const mvs = ds.wms.inventoryMovements;
const byType = mvs.reduce((acc: any, m: any) => {
    acc[m.movementType] = (acc[m.movementType] || 0) + 1;
    return acc;
}, {} as Record<string, number>);
console.log(`Total movements   : ${mvs.length}`);
console.log("By type           :", byType);
console.log(`Inventory positions: ${ds.wms.inventoryPositions.length}`);

const byWH = ds.wms.inventoryPositions.reduce((acc: any, p: any) => {
    acc[p.warehouseId] = (acc[p.warehouseId] || 0) + 1;
    return acc;
}, {} as Record<string, number>);
console.log("Positions by WH   :", byWH);

// ---- WMS document counts ----
console.log(`Receipts          : ${ds.wms.receipts.length}`);
console.log(`Putaway tasks     : ${ds.wms.putawayTasks.length}`);
console.log(`Pick tasks        : ${ds.wms.pickTasks.length}`);
console.log(`Shipments         : ${ds.wms.shipments.length}`);

// ---- Allocations ----
const allocs = ds.wms.stockAllocations;
const allocByType = allocs.reduce((acc: any, a: any) => {
    acc[a.demandType] = (acc[a.demandType] || 0) + 1;
    return acc;
}, {});
const allocByStatus = allocs.reduce((acc: any, a: any) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
}, {});
console.log(`Stock allocations : ${allocs.length}`);
console.log("Allocs by type    :", allocByType);
console.log("Allocs by status  :", allocByStatus);

// ---- Negative balance check ----
const nowBalances = new Map<string, number>();
for (const mv of mvs as any[]) {
    const key = `${mv.itemId}|${mv.locationId}`;
    nowBalances.set(key, (nowBalances.get(key) ?? 0) + mv.quantity);
}
const negatives = [...nowBalances.entries()].filter(([, q]) => q < 0);
if (negatives.length > 0) {
    console.error("NEGATIVE BALANCES:", negatives);
} else {
    console.log("Balance check     : OK (no negative balances)");
}

// ---- asOf projection sanity check ----
// Pick a timestamp in the middle of the window and project inventory
const allTs = mvs.map((m: any) => m.occurredAt).sort((a: number, b: number) => a - b);
const midTs  = allTs[Math.floor(allTs.length / 2)];
const balances = new Map<string, number>();
for (const mv of mvs as any[]) {
    if (mv.occurredAt > midTs) continue;
    const key = `${mv.itemId}|${mv.locationId}`;
    balances.set(key, (balances.get(key) ?? 0) + mv.quantity);
}
const nonZero = [...balances.values()].filter(q => q > 0).length;
console.log(`\nasOf mid-point (${new Date(midTs * 1000).toISOString()}):`);
console.log(`  Non-zero positions: ${nonZero}`);
