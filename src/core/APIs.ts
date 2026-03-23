import { APSApi } from "../../_prebuild/api-libs/aps";
import { WorkOrdersApi as EAMApi } from "../../_prebuild/api-libs/eam";
import { MESApi } from "../../_prebuild/api-libs/mes";
import { QMSApi } from "../../_prebuild/api-libs/qms";
import { DATASETApi, Configuration } from "../../_prebuild/api-libs/dataset";

//------------------------------------------------------------------------------
const APSConfig = new Configuration({ basePath: "/-/api/aps" });
const EAMConfig = new Configuration({ basePath: "/-/api/eam" });
const MESConfig = new Configuration({ basePath: "/-/api/mes" });
const QMSConfig = new Configuration({ basePath: "/-/api/qms" });
const datasetConfig = new Configuration({ basePath: "/-/api/dataset" });

export const APS = new APSApi(APSConfig);
export const EAM = new EAMApi(EAMConfig);
export const MES = new MESApi(MESConfig);
export const QMS = new QMSApi(QMSConfig);
export const DATASET = new DATASETApi(datasetConfig);
