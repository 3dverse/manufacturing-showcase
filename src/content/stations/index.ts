import { StationId } from "./enum";
import { pickingStation } from "./picking_station";
import { labellingStation } from "./labelling_station";
import type { Station } from "../type";

//------------------------------------------------------------------------------
export const stations: Record<StationId, Station> = {
    [StationId.PICKING_STATION]: pickingStation,
    [StationId.LABELLING_STATION]: labellingStation,
};
