//------------------------------------------------------------------------------
import { useCallback, useContext } from "react";
import { faFilePdf } from "@fortawesome/sharp-regular-svg-icons";
import { faExclamationTriangle } from "@fortawesome/sharp-solid-svg-icons";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";
import Button from "@/components/common/Button";
import { PanelTitle } from "@/components/common/panel";

//------------------------------------------------------------------------------
import { ScenarioContext } from "@/contexts/ScenariosContext";

//------------------------------------------------------------------------------
import { generateIncidentReport } from "@/utils/generateIncidentReport";

//------------------------------------------------------------------------------
import type { CellNode } from "@/content/type";
import { type MachineDetails } from "@/content/machine";
import type { ProjectedDowntime, ProjectedOperation, ProjectedProductionOrder } from "@/core/Projection";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const CellIncident = ({
    cell,
    downtimeEvent,
    manufacturingOrder,
    operation,
    machineDetails,
}: {
    cell: CellNode;
    downtimeEvent: ProjectedDowntime;
    manufacturingOrder: ProjectedProductionOrder;
    operation: ProjectedOperation;
    machineDetails: MachineDetails;
}) => {
    //--------------------------------------------------------------------------
    // Context
    const { activeScenarioId, activeStep } = useContext(ScenarioContext);

    //--------------------------------------------------------------------------
    // Handlers
    const clickHandler = useCallback(
        () =>
            generateIncidentReport({
                downtime: downtimeEvent,
                machineName: machineDetails.name,
                workCenterId: cell.hash,
                productionOrder: manufacturingOrder,
                operation,
            }),
        [cell.hash, downtimeEvent, machineDetails, manufacturingOrder, operation],
    );

    //--------------------------------------------------------------------------
    const incidentMessage = (activeScenarioId && activeStep?.incident?.message) || undefined;

    //--------------------------------------------------------------------------
    return (
        <>
            <PanelTitle className="capitalize text-warning-100">
                <p>
                    <Icon icon={faExclamationTriangle} className="mr-2 text-sm text-warning-100" />
                    <span className="font-semibold">Incident reported</span>
                </p>
                <p className="text-sm mt-1">{incidentMessage}</p>
            </PanelTitle>
            <div className="transform-3d shrink-0 bg-warning-800 rounded-md">
                <Button
                    size="sm"
                    variant="outline"
                    className="button bg-warning-100 text-warning-600 hover:bg-warning-50 border-0 -translate-z-[.1px] hover:translate-z-0"
                    onClick={clickHandler}
                >
                    <Icon icon={faFilePdf} className="mr-2 text-sm" />
                    Read the report
                </Button>
            </div>
        </>
    );
};
