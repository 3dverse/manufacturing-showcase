import { listDatasetMetas } from "../../generator/store";
import { DatasetreplyJSON } from "../../utils/openAPI";

export const listDatasets = async (_c: any, _req: any, res: any) => {
    return DatasetreplyJSON({ sites: listDatasetMetas() }, res);
};
