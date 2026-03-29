import { getWarehouses } from "./getWarehouses";
import { getWarehouseById } from "./getWarehouseById";
import { getLocations } from "./getLocations";
import { getLocationById } from "./getLocationById";
import { getInventory } from "./getInventory";
import { getInventorySummary } from "./getInventorySummary";
import { getHandlingUnits } from "./getHandlingUnits";
import { getLots } from "./getLots";
import { getSerialNumbers } from "./getSerialNumbers";
import { getReceipts } from "./getReceipts";
import { getPutawayTasks } from "./getPutawayTasks";
import { getPickTasks } from "./getPickTasks";
import { getShipments } from "./getShipments";
import { getCycleCounts } from "./getCycleCounts";
import { getInventoryMovements } from "./getInventoryMovements";
import { getAllocations } from "./getAllocations";

export const wmsOperations = {
    getWarehouses,
    getWarehouseById,
    getLocations,
    getLocationById,
    getInventory,
    getInventorySummary,
    getHandlingUnits,
    getLots,
    getSerialNumbers,
    getReceipts,
    getPutawayTasks,
    getPickTasks,
    getShipments,
    getCycleCounts,
    getInventoryMovements,
    getAllocations,
};
