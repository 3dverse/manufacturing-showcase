import { useMemo } from "react";
import { createPortal } from "react-dom";

import type { MachineDetails } from "@/content/machine";
import { getDowntimeDocumentation } from "@/content/machine";

import { ScadaModalHeader } from "@/components/scadaEvents/modal/ScadaModalHeader";
import { IncidentPdfDownload } from "@/components/scadaEvents/modal/IncidentPdfDownload";
import { resolveVideoPresentation } from "@/components/scadaEvents/modal/format";
import { ScadaDowntimeSummarySection } from "@/components/scadaEvents/sections/ScadaDowntimeSummarySection";
import { ScadaEquipmentSection } from "@/components/scadaEvents/sections/ScadaEquipmentSection";
import { ScadaReferenceDocumentationSection } from "@/components/scadaEvents/sections/ScadaReferenceDocumentationSection";
import { ScadaNoDocumentationNotice } from "@/components/scadaEvents/sections/ScadaNoDocumentationNotice";
import { ScadaProductionImpactSection } from "@/components/scadaEvents/sections/ScadaProductionImpactSection";
import type { IncidentReportData } from "@/utils/generateIncidentReport";
import { ScadaHistorySection } from "@/components/scadaEvents/sections/ScadaHistorySection";

//------------------------------------------------------------------------------
type Props = {
    open: boolean;
    onClose: () => void;
    reportData: IncidentReportData;
    machineDetails: MachineDetails;
};

//------------------------------------------------------------------------------
export function ScadaEventsModal({ open, onClose, reportData, machineDetails }: Props) {
    const dt = reportData.downtime;

    const downtimeDocs = useMemo(
        () => getDowntimeDocumentation(machineDetails, dt.reasonCode),
        [machineDetails, dt.reasonCode],
    );

    const historyEntries = useMemo(() => {
        if (!downtimeDocs?.history?.length) return [];
        return [...downtimeDocs.history].sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [downtimeDocs]);

    const videoPresentation = useMemo(
        () => (downtimeDocs?.video ? resolveVideoPresentation(downtimeDocs.video) : null),
        [downtimeDocs],
    );

    if (!open) return null;

    return createPortal(
        <aside className="fixed top-0 right-0 bottom-0 w-1/2 max-w-md bg-slate-0/95 backdrop-blur-sm border-l border-slate-200/70 shadow-3xl z-100 overflow-y-auto starting:translate-x-full translate-x-0 transition-all duration-200">
            <ScadaModalHeader title="Downtime events" onClose={onClose} />
            <div className="flex flex-col gap-4 p-5 pt-4 divide-y divide-slate-200/70">
                <ScadaDowntimeSummarySection downtime={dt} />
                {downtimeDocs && (
                    <ScadaReferenceDocumentationSection
                        reasonCode={dt.reasonCode}
                        videoPresentation={videoPresentation}
                        historyEntries={historyEntries}
                    />
                )}
                {!downtimeDocs && <ScadaNoDocumentationNotice reasonCode={dt.reasonCode} />}
                <ScadaEquipmentSection machineName={reportData.machineName} workCenterId={reportData.workCenterId} />
                <ScadaProductionImpactSection reportData={reportData} />
                <ScadaHistorySection historyEntries={historyEntries} />
                <IncidentPdfDownload reportData={reportData} />
            </div>
        </aside>,
        document.body,
    );
}
