import { getPlans } from "./getPlans";
import { getPlanById } from "./getPlanById";
import { getPlanSchedule } from "./getPlanSchedule";
import { getPlanCapacity } from "./getPlanCapacity";
import { getPlanMaterialAvailability } from "./getPlanMaterialAvailability";
import { getPlanExceptions } from "./getPlanExceptions";
import { getPlanKpis } from "./getPlanKpis";
import { getScenarios } from "./getScenarios";
import { getScenarioById } from "./getScenarioById";
import { getResources } from "./getResources";
import { getResourceById } from "./getResourceById";
import { getResourceLoad } from "./getResourceLoad";
import { getDemands } from "./getDemands";
import { getDemandById } from "./getDemandById";
import { getSupplies } from "./getSupplies";
import { getSupplyById } from "./getSupplyById";
import { getPegging } from "./getPegging";
import { getConstraints } from "./getConstraints";

export const apsOperations = {
    getPlans,
    getPlanById,
    getPlanSchedule,
    getPlanCapacity,
    getPlanMaterialAvailability,
    getPlanExceptions,
    getPlanKpis,
    getScenarios,
    getScenarioById,
    getResources,
    getResourceById,
    getResourceLoad,
    getDemands,
    getDemandById,
    getSupplies,
    getSupplyById,
    getPegging,
    getConstraints,
};
