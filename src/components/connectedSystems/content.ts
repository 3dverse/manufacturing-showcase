//------------------------------------------------------------------------------
export const CONNECTED_SYSTEMS = ["SAP", "ERP", "MES", "EAM", "WMS", "QMS", "APS"] as const;
export type SystemId = (typeof CONNECTED_SYSTEMS)[number];

export type ConnectionState = Record<SystemId, boolean>;

export const DEFAULT_CONNECTIONS: Record<SystemId, boolean> = {
    SAP: true,
    ERP: true,
    MES: true,
    EAM: true,
    WMS: true,
    QMS: false,
    APS: false,
} as const;
