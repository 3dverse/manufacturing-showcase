export enum ApiTag {
    APS = "APS",
    EAM = "EAM",
    ERP = "ERP",
    MES = "MES",
    QMS = "QMS",
    WMS = "WMS",
}

type OperationHandlerMap = Record<string, (...args: any[]) => any>;
export const operations: Record<ApiTag, OperationHandlerMap> = {
    APS: {},
    EAM: {},
    ERP: {},
    MES: {},
    QMS: {},
    WMS: {},
};
