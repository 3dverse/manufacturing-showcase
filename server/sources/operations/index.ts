import { getSiteGraph } from "./dataset/generateDataset";
import { getBOM } from "./dataset/getBOM";
import { getDatasetMeta } from "./dataset/getDatasetMeta";
import { listDatasets } from "./dataset/listDatasets";
import { regenerateDatasets } from "./dataset/regenerateDatasets";
import { mesOperations } from "./MES";
import { eamOperations } from "./EAM";
import { erpOperations } from "./ERP";
import { apsOperations } from "./APS";
import { qmsOperations } from "./QMS";
import { wmsOperations } from "./WMS";

export enum ApiTag {
    APS = "APS",
    EAM = "EAM",
    ERP = "ERP",
    MES = "MES",
    QMS = "QMS",
    WMS = "WMS",
    DATASET = "dataset",
}

type OperationHandlerMap = Record<string, (...args: any[]) => any>;
export const operations: Record<ApiTag, OperationHandlerMap> = {
    APS: apsOperations,
    EAM: eamOperations,
    ERP: erpOperations,
    MES: mesOperations,
    QMS: qmsOperations,
    WMS: wmsOperations,
    dataset: { getFactoryGraph: getSiteGraph, getBOM, getDatasetMeta, listDatasets, regenerateDatasets },
};
