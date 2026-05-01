import { useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { faFilePdf } from "@fortawesome/sharp-regular-svg-icons";
import { faXmark } from "@fortawesome/pro-light-svg-icons";

import { Icon } from "@/components/common/Icon";
import Button from "@/components/common/Button";
import { Divider, Field, OngoingBadge, PhaseBadge } from "@/components/correlation/SectionWrapper";
import type { MachineDetails } from "@/content/machine";
import { getDowntimeDocumentation } from "@/content/machine";
import { fmtDuration, fmtTs } from "@/utils/helpers-time";
import { generateIncidentReport, type IncidentReportData } from "@/utils/generateIncidentReport";

//------------------------------------------------------------------------------
function resolveVideoPresentation(url: string): { kind: "youtube"; embedUrl: string } | { kind: "direct"; src: string } | { kind: "link"; href: string } {
    const trimmed = url.trim();
    try {
        const u = new URL(trimmed);
        const host = u.hostname.replace(/^www\./, "");
        if (host === "youtube.com" || host === "m.youtube.com") {
            const v = u.searchParams.get("v");
            if (v) return { kind: "youtube", embedUrl: `https://www.youtube.com/embed/${v}` };
        }
        if (host === "youtu.be") {
            const id = u.pathname.replace(/^\//, "").split("/")[0];
            if (id) return { kind: "youtube", embedUrl: `https://www.youtube.com/embed/${id}` };
        }
    } catch {
        /* ignore */
    }
    if (/\.(mp4|webm|ogg)(\?|$)/i.test(trimmed)) return { kind: "direct", src: trimmed };
    return { kind: "link", href: trimmed };
}

//------------------------------------------------------------------------------
function fmtHistoryDate(d: Date): string {
    return d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

//------------------------------------------------------------------------------
type Props = {
    open: boolean;
    onClose: () => void;
    reportData: IncidentReportData;
    machineDetails: MachineDetails;
};

//------------------------------------------------------------------------------
export function ScadaEventsModal({ open, onClose, reportData, machineDetails }: Props) {
    const handleDownloadPdf = useCallback(() => {
        generateIncidentReport(reportData);
    }, [reportData]);

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
            <header className="sticky top-0 flex items-center justify-between pl-6 pr-3 py-2 bg-slate-0/95 border-b border-slate-200/70 backdrop-blur-sm">
                <h2 className="text-lg font-semibold">Downtime events</h2>
                <Button variant="ghost" colorScheme="neutral" size="lg" className="px-2" onClick={onClose}>
                    <Icon icon={faXmark} />
                </Button>
            </header>
            <div className="flex flex-col gap-4 p-5 pt-4">
                <section>
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                            <p className="text-sm font-semibold leading-tight text-red-700">{dt.reasonCode}</p>
                            {dt.reasonDescription && <p className="text-xs text-muted">{dt.reasonDescription}</p>}
                        </div>
                        <div className="shrink-0 pt-px">{dt.isOngoing && <OngoingBadge />}</div>
                    </div>
                    <Divider />
                    <div className="space-y-1">
                        <Field label="Started" value={fmtTs(dt.startedAt)} />
                        <Field
                            label="Ended"
                            value={
                                dt.endedAt ? fmtTs(dt.endedAt) : <span className="text-orange-600">ongoing</span>
                            }
                        />
                        <Field label="Duration" value={fmtDuration(dt.durationAtAsOf)} />
                        <Field label="Work center" value={dt.workCenterId} />
                    </div>
                </section>

                {downtimeDocs && (
                    <section>
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
                            Reference — {dt.reasonCode}
                        </h3>
                        {videoPresentation &&
                            (videoPresentation.kind === "youtube" ? (
                                <div className="aspect-video w-full overflow-hidden rounded-md bg-slate-900">
                                    <iframe
                                        title={`Reference video for ${dt.reasonCode}`}
                                        src={videoPresentation.embedUrl}
                                        className="size-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            ) : videoPresentation.kind === "direct" ? (
                                <div className="aspect-video w-full overflow-hidden rounded-md bg-slate-900">
                                    <video src={videoPresentation.src} controls className="size-full object-contain" />
                                </div>
                            ) : (
                                <a
                                    href={videoPresentation.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary-600 underline underline-offset-2"
                                >
                                    Open reference video
                                </a>
                            ))}
                        {historyEntries.length > 0 && (
                            <div className="mt-4">
                                <h4 className="text-xs font-semibold text-muted mb-2">History for this fault</h4>
                                <ul className="flex flex-col gap-3">
                                    {historyEntries.map((entry, index) => (
                                        <li
                                            key={`${dt.reasonCode}-history-${index}`}
                                            className="rounded-md border border-slate-200/70 bg-slate-50/80 px-3 py-2"
                                        >
                                            <p className="text-[11px] text-muted">
                                                {fmtHistoryDate(entry.date)} · {entry.author}
                                            </p>
                                            <p className="text-xs text-slate-800 mt-1">{entry.description}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </section>
                )}

                {!downtimeDocs && (
                    <p className="text-xs text-muted border border-dashed border-slate-200/80 rounded-md px-3 py-2">
                        No machine documentation (video or fault history) on file for fault code{" "}
                        <span className="font-mono text-slate-700">{dt.reasonCode}</span>.
                    </p>
                )}

                <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Equipment</h3>
                    <div className="space-y-1">
                        <Field label="Machine" value={reportData.machineName} />
                        <Field label="Work center ID" value={reportData.workCenterId} />
                    </div>
                </section>

                <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
                        Production impact
                    </h3>
                    <div className="space-y-1">
                        {reportData.productionOrder ? (
                            <>
                                <Field label="Production order" value={reportData.productionOrder.orderNumber} />
                                <Field label="Item code" value={reportData.productionOrder.itemCode} />
                                <Field label="Phase" value={<PhaseBadge phase={reportData.productionOrder.phase} />} />
                            </>
                        ) : (
                            <p className="text-xs text-muted">No active order at time of incident.</p>
                        )}
                        {reportData.operation && (
                            <>
                                <Divider />
                                <Field
                                    label="Operation"
                                    value={`${reportData.operation.operationCode} — ${reportData.operation.operationDescription ?? ""}`.trim()}
                                />
                                <Field
                                    label="Qty produced / planned"
                                    value={`${reportData.operation.quantities.goodQuantity} / ${reportData.operation.quantities.plannedQuantity} ${reportData.operation.quantities.uom}`}
                                />
                            </>
                        )}
                    </div>
                </section>

                <Button size="xs" variant="soft" colorScheme="neutral" className="mt-2 w-full sm:w-auto self-start" onClick={handleDownloadPdf}>
                    <Icon icon={faFilePdf} className="mr-2 text-xs" />
                    Download incident report
                </Button>
            </div>
        </aside>,
        document.body,
    );
}
