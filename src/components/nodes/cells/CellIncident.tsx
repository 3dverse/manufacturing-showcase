//------------------------------------------------------------------------------
import { useCallback, useMemo, useState } from "react";
import { faAngleRight } from "@fortawesome/sharp-regular-svg-icons";
import { faExclamationTriangle } from "@fortawesome/sharp-solid-svg-icons";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";
import Button from "@/components/common/Button";
import { PanelTitle } from "@/components/common/panel";

//------------------------------------------------------------------------------
import { ScadaEventsModal } from "@/components/scadaEvents/ScadaEventsModal";

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
    const [scadaModalOpen, setScadaModalOpen] = useState(false);

    const reportData = useMemo(
        () => ({
            downtime: downtimeEvent,
            machineName: machineDetails.name,
            workCenterId: cell.hash,
            productionOrder: manufacturingOrder,
            operation,
        }),
        [cell.hash, downtimeEvent, machineDetails.name, manufacturingOrder, operation],
    );

    const openScadaModal = useCallback(() => setScadaModalOpen(true), []);

    //--------------------------------------------------------------------------
    return (
        <>
            <ScadaEventsModal
                open={scadaModalOpen}
                onClose={() => setScadaModalOpen(false)}
                reportData={reportData}
                machineDetails={machineDetails}
            />
            <PanelTitle className="capitalize text-warning-100">
                <Icon
                    icon={faExclamationTriangle}
                    className="absolute -top-2 left-3 text-2xs text-warning-100 bg-warning-700 rounded-full p-1"
                />
                <p className="text-xs">{downtimeEvent.reasonDescription}</p>
            </PanelTitle>
            <div className="transform-3d shrink-0 bg-warning-800 rounded-md">
                <Button
                    size="xs"
                    variant="outline"
                    className="button bg-warning-100 text-warning-600 hover:bg-warning-50 border-0 -translate-z-[.1px] hover:translate-z-0"
                    onClick={openScadaModal}
                >
                    <Icon icon={faAngleRight} className="mr-2 text-xs" />
                    Take action
                </Button>
            </div>
        </>
    );
};
