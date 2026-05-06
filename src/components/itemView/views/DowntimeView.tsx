//------------------------------------------------------------------------------
import { useContext, useMemo } from "react";

//------------------------------------------------------------------------------
import { Field, OngoingBadge, OverdueBadge, Divider } from "@/components/correlation/SectionWrapper";
import { ViewSection, MiniProgress } from "@/components/itemView/ViewSection";
import { NodeButton } from "@/components/common/NodeButton";
import { fmtHistoryDate, resolveVideoPresentation } from "@/components/scadaEvents/modal/format";

//------------------------------------------------------------------------------
import { FactoryContext } from "@/contexts/FactoryContext";

//------------------------------------------------------------------------------
import { getDowntimeDocumentation, getMachineDocumentation } from "@/content/machine";

//------------------------------------------------------------------------------
import { fmtTs, fmtDuration } from "@/utils/helpers-time";

//------------------------------------------------------------------------------
import type { ProjectedDowntime } from "@/core/Projection";
import type { ViewProps } from "@/components/itemView/ItemViewContent";
import type { CellNode } from "@/content/type";

//------------------------------------------------------------------------------
type Props = ViewProps<ProjectedDowntime>;

//------------------------------------------------------------------------------
export function DowntimeView({ item, projection, correlated }: Props) {
    //--------------------------------------------------------------------------
    // Context
    const { nodeList } = useContext(FactoryContext);

    //--------------------------------------------------------------------------
    // Memos
    const productionOrder = correlated
        ? projection.productionOrders.find((po) => correlated.productionOrders.has(po.id))
        : null;
    const salesOrder = correlated ? projection.salesOrders.find((so) => correlated.salesOrders.has(so.id)) : null;

    const { workCenterId } = item ?? {};
    const node = useMemo(() => nodeList.find((n) => n.hash === workCenterId), [nodeList, workCenterId]);
    const machine = (node as CellNode)?.machines[0] ?? null;
    const downtimeDocs = useMemo(
        () => getDowntimeDocumentation(getMachineDocumentation(machine.name), item?.reasonCode ?? ""),
        [machine, item],
    );

    //--------------------------------------------------------------------------
    if (!item) return <p className="text-sm text-muted text-center py-6">Not in current scope.</p>;
    //--------------------------------------------------------------------------
    return (
        <div data-scenario="corrective-maintenance-step-4" className="flex flex-col gap-4">
            <div>
                <div className="flex items-start justify-between gap-2 mb-4">
                    <p className="text-xl font-semibold">{item.reasonDescription}</p>
                    {item.projected.isOngoing && <OngoingBadge />}
                </div>
                {downtimeDocs?.video && (
                    <>
                        <Divider />
                        <Video video={downtimeDocs.video} />
                    </>
                )}
                {downtimeDocs?.history && (
                    <>
                        <Divider />
                        <History history={downtimeDocs.history} />
                    </>
                )}
                <Divider />
                <div className="space-y-1">
                    <Field label="Work Center" value={<NodeButton nodeId={item.workCenterId} />} />
                    <Field label="Started" value={fmtTs(item.startedAt)} />
                    <Field label="Ended" value={item.endedAt ? fmtTs(item.endedAt) : null} />
                    <Field label="Duration" value={fmtDuration(item.projected.durationAtAsOf)} />
                </div>
            </div>

            {productionOrder && (
                <ViewSection title="Impacted Manufacturing Order">
                    <div className="space-y-1">
                        <Field label="Order" value={productionOrder.orderNumber} />
                        <Field label="Item" value={productionOrder.itemCode} />
                        <Field label="Location" value={productionOrder.locationId} />
                        <MiniProgress pct={productionOrder.projected.progressPercent} />
                    </div>
                </ViewSection>
            )}

            {salesOrder && (
                <ViewSection title="Customer Impact">
                    <div className="space-y-1">
                        <Field label="Order" value={salesOrder.orderNumber} />
                        <Field label="Customer" value={salesOrder.customerId} />
                        <Field label="Requested Delivery" value={fmtTs(salesOrder.requestedDeliveryDate)} />
                        {salesOrder.projected.isOverdue && (
                            <div className="pt-1">
                                <OverdueBadge />
                            </div>
                        )}
                    </div>
                </ViewSection>
            )}
        </div>
    );
}

//------------------------------------------------------------------------------
const Video = ({ video }: { video: string }) => {
    //--------------------------------------------------------------------------
    // Memos
    const videoPresentation = useMemo(() => (video ? resolveVideoPresentation(video) : null), [video]);

    //--------------------------------------------------------------------------
    return (
        <section className="pb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">How to fix</h3>
            {videoPresentation &&
                (videoPresentation.kind === "youtube" ? (
                    <div className="aspect-video w-full overflow-hidden rounded-md bg-slate-900">
                        <iframe
                            title={`Reference video`}
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
        </section>
    );
};

//------------------------------------------------------------------------------
export function History({ history }: { history: { date: Date; description: string; author: string }[] }) {
    return (
        <section className="pb-4">
            {history.length > 0 && (
                <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">History</h3>
                    <ul className="flex flex-col">
                        {history.map((entry, index) => (
                            <li
                                key={`history-${index}`}
                                className="first:rounded-t-md last:rounded-b-md border-x border-t last:border-b border-slate-200/70 bg-slate-50/80 px-3 py-2"
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
    );
}
