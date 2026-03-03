//------------------------------------------------------------------------------
import { scaleLinear, scaleTime } from "@visx/scale";
import { LinePath } from "@visx/shape";
import { curveLinear } from "@visx/curve";
import { Group } from "@visx/group";

//------------------------------------------------------------------------------
import { PanelLabel } from "@/components/common/panel";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export type TimeSeriesPoint = { date: Date; value: number };

export type AreaStorageKpiData = {
    /** Occupancy rate over time (0–100). Goal: avoid underutilization or saturation. */
    occupancyRateByTime: TimeSeriesPoint[];
    /** Storage density over time (0–100). Goal: optimize layout. */
    storageDensityByTime: TimeSeriesPoint[];
    /** Inventory turnover over time. Goal: reduce dormant stock. */
    inventoryTurnoverByTime: TimeSeriesPoint[];
};

const CHART_WIDTH = 180;
const LINE_CHART_HEIGHT = 40;
const PIE_SIZE = 90;

//------------------------------------------------------------------------------
/** Pie slice path: angle 0 = 3 o'clock, angles increase counterclockwise (math convention). */
function pieSlicePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy - r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy - r * Math.sin(endAngle);
    const span = endAngle - startAngle;
    const large = span > Math.PI ? 1 : 0;
    // sweep=0: counterclockwise, so "used" wedge from 0 to usedAngle is the correct slice
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 0 ${x2} ${y2} Z`;
}

//------------------------------------------------------------------------------
function OccupancyPieChart({
    usedPercent,
    size = PIE_SIZE,
    className,
}: {
    usedPercent: number;
    size?: number;
    className?: string;
}) {
    const r = size / 2;
    const used = Math.min(100, Math.max(0, usedPercent)) / 100;
    const usedAngle = used * 2 * Math.PI;
    const slicePath = pieSlicePath(r, r, r, 0, usedAngle);

    //--------------------------------------------------------------------------
    return (
        <svg
            width={size}
            height={size}
            className={cn("overflow-visible -rotate-90 scale-[1_-1] bg-accent-200 rounded-full", className)}
        >
            <path d={slicePath} fill="var(--color-accent)" className="origin-center scale-[.95]" />
        </svg>
    );
}

//------------------------------------------------------------------------------
function KpiLineChart({
    data,
    label,
    valueFormat = (v: number) => v.toFixed(0),
    currentValue,
    color = "var(--color-informative-500)",
    width = CHART_WIDTH,
    height = LINE_CHART_HEIGHT,
    className,
}: {
    data: TimeSeriesPoint[];
    label?: string;
    valueFormat?: (v: number) => string;
    currentValue?: number;
    color?: string;
    width?: number;
    height?: number;
    className?: string;
}) {
    if (data.length === 0) return null;
    const margin = { top: 2, right: 2, bottom: 2, left: 2 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const dateExtent = [
        Math.min(...data.map((d) => d.date.getTime())),
        Math.max(...data.map((d) => d.date.getTime())),
    ] as [number, number];
    const xScale = scaleTime({ domain: dateExtent, range: [0, innerWidth] });
    const values = data.map((d) => d.value);
    const maxVal = Math.max(...values, 0.01);
    const minVal = Math.min(...values, maxVal);
    const yScale = scaleLinear({
        domain: [Math.min(0, minVal), maxVal * 1.1],
        range: [innerHeight, 0],
    });
    return (
        <div className={cn("flex flex-col gap-1", className)}>
            {label && <PanelLabel>{label}</PanelLabel>}
            <div className="flex justify-between">
                {currentValue && (
                    <p className="text-xl font-medium tabular-nums" style={{ color: color as string }}>
                        {valueFormat(currentValue)}
                    </p>
                )}
                <svg width={width} height={height}>
                    <Group left={margin.left} top={margin.top}>
                        <LinePath<TimeSeriesPoint>
                            data={data}
                            x={(d) => xScale(d.date.getTime())}
                            y={(d) => yScale(d.value)}
                            curve={curveLinear}
                            stroke={color}
                            strokeWidth={3}
                        />
                    </Group>
                </svg>
            </div>
        </div>
    );
}

//------------------------------------------------------------------------------
export function AreaStorageKpiCharts({ data, className }: { data: AreaStorageKpiData; className?: string }) {
    //--------------------------------------------------------------------------
    const occupancyCurrent = data.occupancyRateByTime[data.occupancyRateByTime.length - 1]?.value ?? 0;
    const densityCurrent = data.storageDensityByTime[data.storageDensityByTime.length - 1]?.value ?? 0;
    const turnoverCurrent = data.inventoryTurnoverByTime[data.inventoryTurnoverByTime.length - 1]?.value ?? 0;

    //--------------------------------------------------------------------------
    return (
        <div className={cn("flex flex-col gap-4 min-w-0", className)}>
            {/* Occupancy rate: pie + line over time */}
            <div className="flex gap-4">
                <OccupancyPieChart usedPercent={occupancyCurrent} />
                <div className="grow flex flex-col justify-between">
                    <div>
                        <PanelLabel>Occupancy rate</PanelLabel>
                        <p className="text-4xl text-accent font-medium tracking-tighter tabular-nums">
                            {occupancyCurrent.toFixed(0)}%
                        </p>
                    </div>
                    <KpiLineChart data={data.occupancyRateByTime} color="var(--color-accent-400)" />
                </div>
            </div>

            {/* Storage density: line over time */}
            <KpiLineChart
                data={data.storageDensityByTime}
                label="Storage density"
                valueFormat={(v) => `${v.toFixed(0)}%`}
                currentValue={densityCurrent}
                color="var(--color-warning-600)"
            />

            {/* Inventory turnover: line over time */}
            <KpiLineChart
                data={data.inventoryTurnoverByTime}
                label="Inventory turnover"
                valueFormat={(v) => `${v.toFixed(1)}×`}
                currentValue={turnoverCurrent}
                color="var(--color-informative-600)"
            />
        </div>
    );
}
