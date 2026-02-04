export const StationId = {
    PICKING_STATION: "picking_station",
    LABELLING_STATION: "labelling_station",
} as const;

export type StationId = (typeof StationId)[keyof typeof StationId];
