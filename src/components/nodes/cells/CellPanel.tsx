//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { PanelLabel, PanelTitle, PanelWrapper } from "@/components/common/panel";
import { MetricBlock, MiniSparkline } from "@/components/common/metrics/MetricBlock";
import { Gauge } from "@/components/common/metrics/Gauge";
import { MachinePanel } from "@/components/nodes/machines/MachinePanel";
import { useCellKpis } from "@/components/nodes/cells/useCellKpis";

//------------------------------------------------------------------------------
import type { CellNode } from "@/content/type";

//------------------------------------------------------------------------------
export function CellPanel({ cell }: { cell: CellNode }) {
    const kpis = useCellKpis(cell);

    return (
        <div className="flex flex-col gap-1 w-full pointer-events-auto">
            <ViewerPanel as="article" className="divide-y divide-slate-100 appear-in-from-left opacity-0">
                <PanelWrapper as="header" className="flex items-center justify-between py-2 pl-3 pr-4">
                    <PanelTitle className="mb-0 text-sm text-default">{cell.name} CELL</PanelTitle>
                    <p className="text-right text-2xs leading-tight text-muted/80">No incidents reported</p>
                </PanelWrapper>

                <section className="flex justify-between gap-4 px-3 pt-4 pb-2">
                    <Gauge value={kpis.oee} className="w-32!" />
                    <div className="grow">
                        <PanelLabel>OEE</PanelLabel>
                        <MiniSparkline
                            data={kpis.oeeHistory}
                            color="var(--color-positive-500)"
                            className="mt-4 opacity-80"
                        />
                    </div>
                </section>

                <section className="p-2">
                    <div className="grid grid-cols-2 gap-x-4 rounded-lg bg-slate-0/30 border border-slate-200/50 px-3 py-2">
                        <MetricBlock
                            label="Scrap rate"
                            value={kpis.scrapRate.toFixed(1)}
                            unit="%"
                            valueClassName={kpis.scrapRate > 3 ? "text-warning-600" : "text-positive-600"}
                            sparklineData={kpis.scrapRateHistory}
                            sparklineInvert
                        />
                        <MetricBlock
                            label="Unit production cost"
                            value={kpis.unitProductionCost.toFixed(1)}
                            unit="€"
                            subtitle="per unit"
                        />
                        <MetricBlock
                            label="On-Time Delivery"
                            value={kpis.otd}
                            unit="%"
                            valueClassName={
                                kpis.otd >= 95
                                    ? "text-positive-600"
                                    : kpis.otd >= 85
                                      ? "text-accent"
                                      : "text-warning-600"
                            }
                        />
                        <div className="col-span-2 grid grid-cols-2 gap-x-4 gap-y-2 pt-2 mt-1 border-t border-slate-200/60">
                            <MetricBlock
                                label="MTBF"
                                value={kpis.mtbfHours}
                                unit="h"
                                subtitle="Mean Time Between Failures"
                            />
                            <MetricBlock
                                label="MTTR"
                                value={kpis.mttrMinutes}
                                unit="min"
                                subtitle="Mean Time To Repair"
                            />
                        </div>
                    </div>
                </section>
            </ViewerPanel>

            {cell.machines.map((machine, index) => (
                <MachinePanel
                    key={machine.euid}
                    machine={machine}
                    className="appear-in-from-right opacity-0"
                    style={
                        {
                            "--animation-delay": `${index * 0.25 + 1}s`,
                        } as React.CSSProperties
                    }
                />
            ))}
        </div>
    );
}
