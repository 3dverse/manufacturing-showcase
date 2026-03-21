import { getDataset } from "../../generator/store";
import { APSreplyJSON, type APSOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getScenarioById: APSOperationHandler<"getScenarioById"> = async (_c, req, res) => {
    const ds = getDataset();
    const id = req.params.scenarioId as string;
    const scenario = ds.aps.scenarios.get(id);
    if (!scenario) return notFound(id, res) as any;
    return APSreplyJSON({ data: scenario }, res);
};
