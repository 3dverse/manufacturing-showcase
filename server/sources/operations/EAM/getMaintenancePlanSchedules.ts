import { getDataset } from "../../generator/store";
import { EAMreplyJSON, type EAMOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getMaintenancePlanSchedules: EAMOperationHandler<"getMaintenancePlanSchedules"> = async (_c, req, res) => {
    const ds = getDataset();
    const id = req.params.planId as string;
    if (!ds.eam.maintenancePlans.has(id)) return notFound(id, res) as any;
    const { fromDate, toDate } = req.query as any;

    let schedules = ds.eam.maintenanceSchedules.get(id) ?? [];
    if (fromDate) schedules = schedules.filter((s) => s.dueDate >= fromDate);
    if (toDate) schedules = schedules.filter((s) => s.dueDate <= toDate);

    return EAMreplyJSON({ maintenancePlanId: id, schedules }, res);
};
