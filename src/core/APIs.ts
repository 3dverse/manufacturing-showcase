import { APSApi } from "../../_prebuild/api-libs/aps";
//import { EAMApi } from "../../_prebuild/api-libs/eam";
//import { ERPApi } from "../../_prebuild/api-libs/erp";
import { MESApi } from "../../_prebuild/api-libs/mes";
import { QMSApi } from "../../_prebuild/api-libs/qms";
//import { WMSApi } from "../../_prebuild/api-libs/wms";
import { MESApi as DatasetApi, Configuration } from "../../_prebuild/api-libs/dataset";

//------------------------------------------------------------------------------
// TODO: fix, some libs don't export correctly

//------------------------------------------------------------------------------
const APSConfig = new Configuration({ basePath: "http://localhost:3000/-/api/aps" });
// const EAMConfig = new Configuration({ basePath: "http://localhost:3000/-/api/eam" });
// const ERPConfig = new Configuration({ basePath: "http://localhost:3000/-/api/erp" });
const MESConfig = new Configuration({ basePath: "http://localhost:3000/-/api/mes" });
const QMSConfig = new Configuration({ basePath: "http://localhost:3000/-/api/qms" });
// const WMSConfig = new Configuration({ basePath: "http://localhost:3000/-/api/wms" });
const datasetConfig = new Configuration({ basePath: "http://localhost:3000/-/api/dataset" });

export const APS = new APSApi(APSConfig);
//export const EAM = new EAMApi(EAMConfig);
//export const ERP = new ERPApi(ERPConfig);
export const MES = new MESApi(MESConfig);
export const QMS = new QMSApi(QMSConfig);
export const DATASET = new DatasetApi(datasetConfig);
//export const WMS = new WMSApi(WMSConfig);
