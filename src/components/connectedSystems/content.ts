//------------------------------------------------------------------------------
export const CONNECTED_SYSTEMS = ["SAP", "MES", "WMS", "PSS"] as const;
export type SystemId = (typeof CONNECTED_SYSTEMS)[number];

export type ConnectionState = Record<SystemId, boolean>;

export const DEFAULT_CONNECTIONS: Record<SystemId, boolean> = {
    SAP: true,
    MES: true,
    WMS: true,
    PSS: false,
} as const;
