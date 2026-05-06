//------------------------------------------------------------------------------
import { tourGuide } from "./tour-guide/tour-guide";
import { correctiveMaintenance } from "./corrective-maintenance/corrective-maintenance";
import { predictiveMaintenancePlacehoder } from "./placeHolders";

//------------------------------------------------------------------------------
import type { ScenarioDefinition } from "./types";

//------------------------------------------------------------------------------
export const FEATURED_SCENARIOS: ScenarioDefinition[] = [
    tourGuide,
    correctiveMaintenance,
    predictiveMaintenancePlacehoder,
];
