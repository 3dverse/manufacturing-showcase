import { getDataset } from "../../generator/store";
import { APSreplyJSON, type APSOperationHandler } from "../../utils/openAPI";

export const getPegging: APSOperationHandler<"getPegging"> = async (_c, _req, res) => {
    const ds = getDataset();
    return APSreplyJSON({ data: ds.aps.pegging }, res);
};
