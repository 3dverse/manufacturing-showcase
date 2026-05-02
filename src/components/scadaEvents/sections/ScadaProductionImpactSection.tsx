import { Field } from "@/components/correlation/SectionWrapper";
import type { IncidentReportData } from "@/utils/generateIncidentReport";

//------------------------------------------------------------------------------
type Props = {
    reportData: IncidentReportData;
};

//------------------------------------------------------------------------------
export function ScadaProductionImpactSection({ reportData }: Props) {
    const { productionOrder, operation } = reportData;

    return (
        <section className="pb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Production impact</h3>
            <div className="space-y-1">
                {productionOrder ? (
                    <>
                        <Field label="Production order" value={productionOrder.orderNumber} />
                        <Field label="Item code" value={productionOrder.itemCode} />
                    </>
                ) : (
                    <p className="text-xs text-muted">No active order at time of incident.</p>
                )}
                {operation && (
                    <>
                        <Field
                            label="Operation"
                            value={`${operation.operationCode} — ${operation.operationDescription ?? ""}`.trim()}
                        />
                        <Field
                            label="Qty produced / planned"
                            value={`${operation.quantities.goodQuantity} / ${operation.quantities.plannedQuantity} ${operation.quantities.uom}`}
                        />
                    </>
                )}
            </div>
        </section>
    );
}
