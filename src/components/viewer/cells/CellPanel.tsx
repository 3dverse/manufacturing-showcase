//------------------------------------------------------------------------------
import { scaleLinear } from "@visx/scale";
import { LinePath } from "@visx/shape";
import { curveLinear } from "@visx/curve";
import { Group } from "@visx/group";

//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { PanelLabel, PanelTitle, PanelWrapper } from "@/components/common/panel";
import OEEGauge from "@/components/dashboard/OEE/OEEGauge";
import { useCellKpis } from "./useCellKpis";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { CellNode } from "@/content/type";

//------------------------------------------------------------------------------
const SPARKLINE_WIDTH = 64;
const SPARKLINE_HEIGHT = 20;

function MiniSparkline({
    data,
    color = "var(--color-accent-500)",
    invert = false,
    className,
}: {
    data: number[];
    color?: string;
    invert?: boolean;
    className?: string;
}) {
    if (data.length < 2) return null;
    const margin = { top: 2, right: 2, bottom: 2, left: 2 };
    const innerW = SPARKLINE_WIDTH - margin.left - margin.right;
    const innerH = SPARKLINE_HEIGHT - margin.top - margin.bottom;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const pad = max === min ? 1 : 0;
    const xScale = scaleLinear({ domain: [0, data.length - 1], range: [0, innerW] });
    const yScale = scaleLinear({
        domain: invert ? [max + pad, min - pad] : [min - pad, max + pad],
        range: [innerH, 0],
    });
    const pathData = data.map((y, x) => ({ x, y }));
    return (
        <svg width={SPARKLINE_WIDTH} height={SPARKLINE_HEIGHT} className={cn("overflow-visible", className)}>
            <Group left={margin.left} top={margin.top}>
                <LinePath
                    data={pathData}
                    x={(d) => xScale(d.x)}
                    y={(d) => yScale(d.y)}
                    curve={curveLinear}
                    stroke={color}
                    strokeWidth={1.5}
                />
            </Group>
        </svg>
    );
}

//------------------------------------------------------------------------------
function KpiBlock({
    label,
    value,
    unit,
    subtitle,
    valueClassName,
    sparklineData,
    sparklineInvert,
}: {
    label: string;
    value: string | number;
    unit?: string;
    subtitle?: string;
    valueClassName?: string;
    sparklineData?: number[];
    sparklineInvert?: boolean;
}) {
    return (
        <div className="flex flex-col gap-0.5 min-w-0">
            <PanelLabel className="text-2xs text-muted/90">{label}</PanelLabel>
            <div className="flex items-baseline justify-between gap-2">
                <span className={cn("text-xl font-semibold tabular-nums tracking-tight", valueClassName)}>
                    {value}
                    {unit != null && <span className="text-sm font-normal text-muted ml-0.5">{unit}</span>}
                </span>
                {sparklineData && sparklineData.length >= 2 && (
                    <MiniSparkline data={sparklineData} invert={sparklineInvert} />
                )}
            </div>
            {subtitle != null && <p className="text-2xs text-muted/80">{subtitle}</p>}
        </div>
    );
}

//------------------------------------------------------------------------------
export function CellPanel({ cell }: { cell: CellNode }) {
    const kpis = useCellKpis(cell);

    return (
        <ViewerPanel
            as="article"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-96 2xl:w-120 max-h-[85vh] overflow-y-auto divide-y divide-slate-100 pointer-events-auto z-10 appear-in-from-right opacity-0 [--animation-delay:.75s]"
        >
            <PanelWrapper className="flex items-center justify-between py-2 pl-3 pr-4">
                <PanelTitle className="mb-0 text-sm text-default">{cell.name} CELL</PanelTitle>
                <p className="bg-accent-100/30 px-1.5 py-px rounded-sm text-2xs text-muted/80">No incidents reported</p>
            </PanelWrapper>

            <section className="flex justify-between gap-4 px-3 pt-4 pb-2">
                <OEEGauge value={kpis.oee} className="w-48!" />
                <div className="grow">
                    <PanelLabel>OEE</PanelLabel>
                    <MiniSparkline
                        data={kpis.oeeHistory}
                        color="var(--color-positive-500)"
                        className="mt-4 opacity-80"
                    />
                </div>
            </section>

            <section className="px-3 py-3">
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 rounded-lg bg-slate-0/30 border border-slate-200/50 p-3">
                    <KpiBlock
                        label="Scrap rate"
                        value={kpis.scrapRate.toFixed(1)}
                        unit="%"
                        valueClassName={kpis.scrapRate > 3 ? "text-warning-600" : "text-positive-600"}
                        sparklineData={kpis.scrapRateHistory}
                        sparklineInvert
                    />
                    <KpiBlock
                        label="Unit production cost"
                        value={kpis.unitProductionCost.toFixed(1)}
                        unit="€"
                        subtitle="per unit"
                    />
                    <KpiBlock
                        label="On-Time Delivery"
                        value={kpis.otd}
                        unit="%"
                        valueClassName={
                            kpis.otd >= 95 ? "text-positive-600" : kpis.otd >= 85 ? "text-accent" : "text-warning-600"
                        }
                    />
                    <div className="col-span-2 grid grid-cols-2 gap-x-4 gap-y-2 pt-2 mt-1 border-t border-slate-200/60">
                        <KpiBlock label="MTBF" value={kpis.mtbfHours} unit="h" subtitle="Mean Time Between Failures" />
                        <KpiBlock label="MTTR" value={kpis.mttrMinutes} unit="min" subtitle="Mean Time To Repair" />
                    </div>
                </div>
            </section>
        </ViewerPanel>
    );
}
