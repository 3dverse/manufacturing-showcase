import { getAssets } from "./getAssets";
import { getAssetById } from "./getAssetById";
import { getAssetHistory } from "./getAssetHistory";
import { getLocations } from "./getLocations";
import { getLocationById } from "./getLocationById";
import { getWorkOrders } from "./getWorkOrders";
import { getWorkOrderById } from "./getWorkOrderById";
import { getWorkOrderOperations } from "./getWorkOrderOperations";
import { getMaintenancePlans } from "./getMaintenancePlans";
import { getMaintenancePlanById } from "./getMaintenancePlanById";
import { getMaintenancePlanSchedules } from "./getMaintenancePlanSchedules";
import { getServiceRequests } from "./getServiceRequests";
import { getServiceRequestById } from "./getServiceRequestById";
import { getInspections } from "./getInspections";
import { getInspectionById } from "./getInspectionById";

export const eamOperations = {
    getAssets,
    getAssetById,
    getAssetHistory,
    getLocations,
    getLocationById,
    getWorkOrders,
    getWorkOrderById,
    getWorkOrderOperations,
    getMaintenancePlans,
    getMaintenancePlanById,
    getMaintenancePlanSchedules,
    getServiceRequests,
    getServiceRequestById,
    getInspections,
    getInspectionById,
};
