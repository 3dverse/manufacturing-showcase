import { APSApi } from "../../_prebuild/api-libs/aps";
import { WorkOrdersApi as EAMApi } from "../../_prebuild/api-libs/eam";
import { MESApi } from "../../_prebuild/api-libs/mes";
import { QMSApi } from "../../_prebuild/api-libs/qms";
import { DATASETApi, Configuration } from "../../_prebuild/api-libs/dataset";

//------------------------------------------------------------------------------
const APSConfig = new Configuration({ basePath: "http://localhost:3000/-/api/aps" });
const EAMConfig = new Configuration({ basePath: "http://localhost:3000/-/api/eam" });
const MESConfig = new Configuration({ basePath: "http://localhost:3000/-/api/mes" });
const QMSConfig = new Configuration({ basePath: "http://localhost:3000/-/api/qms" });
const datasetConfig = new Configuration({ basePath: "http://localhost:3000/-/api/dataset" });

export const APS = new APSApi(APSConfig);
export const EAM = new EAMApi(EAMConfig);
export const MES = new MESApi(MESConfig);
export const QMS = new QMSApi(QMSConfig);
export const DATASET = new DATASETApi(datasetConfig);
