import { StationId } from "./enum";
import { pickingStation } from "./picking_station";
import { labellingStation } from "./labelling_station";

//------------------------------------------------------------------------------
export const stations = {
    [StationId.PICKING_STATION]: pickingStation,
    [StationId.LABELLING_STATION]: labellingStation,
};
