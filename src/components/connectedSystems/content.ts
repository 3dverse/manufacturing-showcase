//------------------------------------------------------------------------------
export enum Systems {
    SAP = "SAP",
    ERP = "ERP",
    MES = "MES",
    EAM = "EAM",
    WMS = "WMS",
    QMS = "QMS",
    APS = "APS",
}

export type SystemId = Systems;

export type ConnectionState = Record<Systems, boolean>;

export const CONNECTED_SYSTEMS = Object.values(Systems);

export const DEFAULT_CONNECTIONS: Record<Systems, boolean> = {
    [Systems.SAP]: true,
    [Systems.ERP]: true,
    [Systems.MES]: true,
    [Systems.EAM]: true,
    [Systems.WMS]: true,
    [Systems.QMS]: false,
    [Systems.APS]: false,
};
