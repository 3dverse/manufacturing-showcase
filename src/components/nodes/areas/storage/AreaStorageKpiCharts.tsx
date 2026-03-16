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
export function AreaStorageKpiCharts({ data, className }: { data: AreaStorageKpiData; className?: string }) {
    //--------------------------------------------------------------------------
    const occupancyCurrent = data.occupancyRateByTime[data.occupancyRateByTime.length - 1]?.value ?? 0;
    const densityCurrent = data.storageDensityByTime[data.storageDensityByTime.length - 1]?.value ?? 0;
    const turnoverCurrent = data.inventoryTurnoverByTime[data.inventoryTurnoverByTime.length - 1]?.value ?? 0;

    //--------------------------------------------------------------------------
    return (
        <div className={cn("flex flex-col gap-4 min-w-0", className)}>
            <div className="flex gap-4">
                <OccupancyPieChart usedPercent={occupancyCurrent} />
                <div className="grow flex flex-col justify-between">
                    <div>
                        <PanelLabel>Occupancy rate</PanelLabel>
                        <p className="text-4xl text-accent font-medium tracking-tighter tabular-nums">
                            {occupancyCurrent.toFixed(0)}%
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex justify-between gap-4">
                <div>
                    <PanelLabel>Storage density</PanelLabel>
                    <p className="text-xl text-warning font-medium tracking-tighter tabular-nums">
                        {densityCurrent.toFixed(0)}%
                    </p>
                </div>

                <div>
                    <PanelLabel>Inventory turnover</PanelLabel>
                    <p className="text-xl text-informative font-medium tracking-tighter tabular-nums">
                        {turnoverCurrent.toFixed(1)}×
                    </p>
                </div>
            </div>
        </div>
    );
}
