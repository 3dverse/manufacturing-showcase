//------------------------------------------------------------------------------
import React, { useMemo, useState } from "react";
import { Bar } from "@visx/shape";
import { LinePath } from "@visx/shape";
import { scaleBand, scaleLinear } from "@visx/scale";
import { Group } from "@visx/group";
import { useParentSize } from "@visx/responsive";
import { curveLinear } from "@visx/curve";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
const MONTH_LETTERS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];
/** Minimum width per bar (including padding) to ensure readability. */
const MIN_BAR_WIDTH = 8;
/** Minimum width per bar when comparing (two bars per month). */
const MIN_BAR_WIDTH_COMPARE = 12;

//------------------------------------------------------------------------------
interface MonthlyProductionData {
    monthIndex: number;
    qualityProducts: number;
    nonQualityProducts: number;
    capacity: number;
    warningIncidents: number;
    errorIncidents: number;
}

interface MonthlyProductionChartProps {
    /** 12 values (Jan–Dec) for current year. */
    thisYear: number[];
    /** 12 values (Jan–Dec) for previous year. When showCompare is true, both series are drawn. */
    previousYear?: number[];
    /** When true, show both this year and previous year for comparison. */
    showCompare?: boolean;
    /** Current month index (0–11, where 0 = January). If not provided, uses current date. */
    currentMonthIndex?: number;
    /** Optional detailed monthly production data with quality breakdown and incidents. */
    monthlyData?: MonthlyProductionData[];
    height?: number;
    className?: string;
}

//------------------------------------------------------------------------------
export const MonthlyProductionChart: React.FC<MonthlyProductionChartProps> = ({
    thisYear,
    previousYear = [],
    showCompare = false,
    currentMonthIndex: propCurrentMonthIndex,
    monthlyData,
    height = 100,
    className,
}) => {
    const { width, parentRef } = useParentSize({ debounceTime: 150 });
    const [hoveredMonth, setHoveredMonth] = useState<{ index: number; x: number; y: number } | null>(null);
    const data = useMemo(() => (thisYear.length === 12 ? thisYear : []), [thisYear]);
    const currentMonthIndex = propCurrentMonthIndex ?? new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const previousYearNumber = currentYear - 1;

    const margin = { top: 0, right: 0, bottom: 0, left: 0 };
    const innerWidth = Math.max(0, width - margin.left - margin.right);
    const innerHeight = height - margin.top - margin.bottom;

    // Calculate how many months fit based on available width
    const visibleMonths = useMemo(() => {
        const minWidthPerMonth = showCompare ? MIN_BAR_WIDTH_COMPARE : MIN_BAR_WIDTH;
        const maxMonths = Math.floor(innerWidth / minWidthPerMonth);
        // Show at least 3 months, at most 12
        return Math.max(3, Math.min(12, maxMonths));
    }, [innerWidth, showCompare]);

    // Build month indices: show previous months (including from previous year if needed), then current month at the end
    // Don't show future months
    const monthIndices = useMemo(() => {
        const indices: Array<{ monthIndex: number; isPreviousYear: boolean }> = [];

        // Always include current month at the end
        indices.push({ monthIndex: currentMonthIndex, isPreviousYear: false });

        // Add previous months from current year, working backwards
        for (let i = currentMonthIndex - 1; i >= 0 && indices.length < visibleMonths; i--) {
            indices.unshift({ monthIndex: i, isPreviousYear: false });
        }

        // If we still need more months and have previous year data, add from previous year
        if (previousYear.length === 12 && indices.length < visibleMonths) {
            // Start from December of previous year and go backwards
            for (let i = 11; i >= 0 && indices.length < visibleMonths; i--) {
                // Skip if this month is already included (shouldn't happen, but safety check)
                if (i === currentMonthIndex) continue;
                indices.unshift({ monthIndex: i, isPreviousYear: true });
            }
        }

        return indices;
    }, [visibleMonths, currentMonthIndex, previousYear.length]);

    const xScale = scaleBand({
        domain: monthIndices.map((_, i) => i),
        range: [0, innerWidth],
        padding: 0.05,
    });

    // Calculate max value for y-scale from visible months only
    // Include current month's value to ensure scale updates as it increments
    const maxVal = useMemo(() => {
        const values: number[] = [];
        monthIndices.forEach(({ monthIndex, isPreviousYear }) => {
            if (isPreviousYear && previousYear.length === 12) {
                values.push(previousYear[monthIndex] ?? 0);
            } else {
                values.push(data[monthIndex] ?? 0);
            }
            if (showCompare && previousYear.length === 12 && !isPreviousYear) {
                values.push(previousYear[monthIndex] ?? 0);
            }
        });
        // Always include current month's value to ensure scale accommodates growth
        if (data.length > currentMonthIndex) {
            values.push(data[currentMonthIndex] ?? 0);
        }
        return Math.max(...values, 1);
    }, [monthIndices, data, previousYear, showCompare, currentMonthIndex]);

    const yScale = useMemo(
        () =>
            scaleLinear({
                domain: [0, maxVal * 1.05 || 1],
                range: [innerHeight, 0],
            }),
        [maxVal, innerHeight],
    );

    const bandWidth = xScale.bandwidth();
    const barWidth = showCompare ? bandWidth / 2 - 2 : bandWidth;

    // Calculate max incidents for incident line scale (if monthlyData is provided)
    const maxIncidents = useMemo(() => {
        if (!monthlyData) return 0;
        const values: number[] = [];
        monthIndices.forEach(({ monthIndex }) => {
            const monthInfo = monthlyData[monthIndex];
            if (monthInfo) {
                values.push(monthInfo.warningIncidents);
                values.push(monthInfo.errorIncidents);
            }
        });
        return Math.max(...values, 1);
    }, [monthlyData, monthIndices]);

    // Scale for incidents: display in top 30% of chart
    const incidentTop = innerHeight * 0.3;
    const incidentYScale = useMemo(
        () =>
            scaleLinear({
                domain: [0, maxIncidents * 1.2 || 1],
                range: [innerHeight, incidentTop],
            }),
        [maxIncidents, innerHeight, incidentTop],
    );

    if (data.length === 0) return null;

    return (
        <div ref={parentRef} className={cn("w-full relative", className)}>
            {/* Tooltip */}
            {hoveredMonth && (
                <div
                    className="absolute min-w-24 z-10 px-2 py-1 text-xs rounded shadow-lg bg-neutral-800 text-neutral-0 pointer-events-none"
                    style={{
                        left: hoveredMonth.x,
                        top: hoveredMonth.y,
                        transform: "translate(-50%, -75%)",
                    }}
                >
                    {(() => {
                        const monthInfo = monthIndices[hoveredMonth.index];
                        const monthName = MONTH_NAMES[monthInfo.monthIndex];
                        const year = monthInfo.isPreviousYear ? previousYearNumber : currentYear;
                        const valueThis = data[monthInfo.monthIndex] ?? 0;
                        const valuePrev = previousYear[monthInfo.monthIndex] ?? 0;
                        const monthData = monthlyData?.[monthInfo.monthIndex];

                        if (showCompare && previousYear.length === 12 && !monthInfo.isPreviousYear) {
                            return (
                                <>
                                    <div>{monthName}</div>
                                    <div className="font-semibold tabular-nums">
                                        {currentYear}: {valueThis.toLocaleString()} products
                                    </div>
                                    <div className="tabular-nums text-neutral-300">
                                        {previousYearNumber}: {valuePrev.toLocaleString()} products
                                    </div>
                                    {monthData && (
                                        <>
                                            <div className="mt-1 pt-1 border-t border-neutral-600">
                                                <div className="text-green-400">
                                                    Quality: {monthData.qualityProducts.toLocaleString()}
                                                </div>
                                                <div className="text-orange-400">
                                                    Non-Quality: {monthData.nonQualityProducts.toLocaleString()}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </>
                            );
                        }

                        return (
                            <>
                                <div>
                                    {monthName} {year}
                                </div>
                                <div className="font-semibold tabular-nums">
                                    {(monthInfo.isPreviousYear ? valuePrev : valueThis).toLocaleString()} products
                                </div>
                                {monthData && (
                                    <>
                                        <div className="mt-1 pt-1 border-t border-neutral-600">
                                            <div className="text-green-400">
                                                Quality: {monthData.qualityProducts.toLocaleString()}
                                            </div>
                                            <div className="text-orange-400">
                                                Non-Quality: {monthData.nonQualityProducts.toLocaleString()}
                                            </div>
                                            <div className="mt-1 pt-1 border-t border-neutral-600">
                                                <div className="text-yellow-400">
                                                    Warnings: {monthData.warningIncidents}
                                                </div>
                                                <div className="text-red-400">Errors: {monthData.errorIncidents}</div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </>
                        );
                    })()}
                </div>
            )}
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
                <Group left={margin.left} top={margin.top}>
                    {monthIndices.map((monthInfo, displayIndex) => {
                        const x0 = xScale(displayIndex) ?? 0;
                        const valThis = data[monthInfo.monthIndex] ?? 0;
                        const valPrev =
                            monthInfo.isPreviousYear && previousYear.length === 12
                                ? (previousYear[monthInfo.monthIndex] ?? 0)
                                : (previousYear[monthInfo.monthIndex] ?? 0);

                        const handleMouseEnter = () => {
                            // Position tooltip at center of month group (or single bar), above it
                            const monthCenterX =
                                (x0 ?? 0) +
                                (showCompare && !monthInfo.isPreviousYear ? barWidth + 1 : barWidth / 2) +
                                margin.left;
                            const barTopY = margin.top;
                            setHoveredMonth({
                                index: displayIndex,
                                x: monthCenterX,
                                y: barTopY - 8,
                            });
                        };

                        const handleMouseLeave = () => setHoveredMonth(null);

                        if (showCompare && previousYear.length === 12 && !monthInfo.isPreviousYear) {
                            const barHThis = innerHeight - yScale(valThis);
                            const barHPrev = innerHeight - yScale(valPrev);
                            return (
                                <React.Fragment key={displayIndex}>
                                    <Bar
                                        x={x0}
                                        y={innerHeight - barHThis}
                                        width={barWidth}
                                        height={barHThis}
                                        fill="var(--color-neutral-800)"
                                        opacity={0.9}
                                        onMouseEnter={handleMouseEnter}
                                        onMouseLeave={handleMouseLeave}
                                    />
                                    <Bar
                                        x={x0 + barWidth + 2}
                                        y={innerHeight - barHPrev}
                                        width={barWidth}
                                        height={barHPrev}
                                        fill="var(--color-chart-muted, #94a3b8)"
                                        opacity={0.7}
                                        onMouseEnter={handleMouseEnter}
                                        onMouseLeave={handleMouseLeave}
                                    />
                                </React.Fragment>
                            );
                        }

                        // If monthlyData is provided and not in compare mode, show stacked bars
                        if (monthlyData && !showCompare && !monthInfo.isPreviousYear) {
                            const monthData = monthlyData[monthInfo.monthIndex];
                            if (monthData) {
                                const xCenter = x0 + barWidth / 2;

                                // Calculate y positions for each segment (stacked from bottom to top)
                                const orangeTop = yScale(monthData.nonQualityProducts); // Top of orange bar (non-quality at bottom)
                                const greenTop = yScale(monthData.qualityProducts + monthData.nonQualityProducts); // Top of green bar (quality at top)

                                // Heights
                                const orangeHeight = innerHeight - orangeTop;
                                const greenHeight = orangeTop - greenTop;

                                return (
                                    <Group
                                        key={displayIndex}
                                        onMouseEnter={handleMouseEnter}
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        {/* Orange bar: Non-quality products (bottom) */}
                                        {monthData.nonQualityProducts > 0 && (
                                            <Bar
                                                x={xCenter - barWidth / 2}
                                                y={orangeTop}
                                                width={barWidth}
                                                height={orangeHeight}
                                                fill="var(--color-warning, #f97316)"
                                                opacity={0.8}
                                            />
                                        )}
                                        {/* Green bar: Quality products (top) */}
                                        {monthData.qualityProducts > 0 && (
                                            <Bar
                                                x={xCenter - barWidth / 2}
                                                y={greenTop}
                                                width={barWidth}
                                                height={greenHeight}
                                                fill="var(--color-positive, #22c55e)"
                                                opacity={0.8}
                                            />
                                        )}
                                    </Group>
                                );
                            }
                        }

                        const value = monthInfo.isPreviousYear && previousYear.length === 12 ? valPrev : valThis;
                        const barHeight = innerHeight - yScale(value);
                        return (
                            <Bar
                                key={displayIndex}
                                x={x0}
                                y={innerHeight - barHeight}
                                width={barWidth}
                                height={barHeight}
                                fill={
                                    monthInfo.isPreviousYear ? "var(--color-neutral-700)" : "var(--token-text-default)"
                                }
                                // opacity={monthInfo.isPreviousYear ? 0.7 : 0.8}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                            />
                        );
                    })}

                    {/* Warning incidents line (if monthlyData is provided and not in compare mode) */}
                    {monthlyData && !showCompare && maxIncidents > 0 && (
                        <LinePath
                            data={monthIndices.filter(({ isPreviousYear }) => !isPreviousYear)}
                            x={(_, i) => {
                                const x0 = xScale(i) ?? 0;
                                return x0 + bandWidth / 2;
                            }}
                            y={(_, i) => {
                                const monthInfo = monthIndices[i];
                                const monthData = monthlyData[monthInfo.monthIndex];
                                return monthData ? incidentYScale(monthData.warningIncidents) : innerHeight;
                            }}
                            curve={curveLinear}
                            stroke="var(--color-warning-400, #fb923c)"
                            strokeWidth={1}
                            strokeOpacity={0.9}
                        />
                    )}

                    {/* Error incidents line (if monthlyData is provided and not in compare mode) */}
                    {monthlyData && !showCompare && maxIncidents > 0 && (
                        <LinePath
                            data={monthIndices.filter(({ isPreviousYear }) => !isPreviousYear)}
                            x={(_, i) => {
                                const x0 = xScale(i) ?? 0;
                                return x0 + bandWidth / 2;
                            }}
                            y={(_, i) => {
                                const monthInfo = monthIndices[i];
                                const monthData = monthlyData[monthInfo.monthIndex];
                                return monthData ? incidentYScale(monthData.errorIncidents) : innerHeight;
                            }}
                            curve={curveLinear}
                            stroke="var(--color-negative, #ef4444)"
                            strokeWidth={1}
                            strokeOpacity={0.9}
                        />
                    )}

                    {/* Dots for incident lines */}
                    {monthlyData &&
                        !showCompare &&
                        maxIncidents > 0 &&
                        monthIndices
                            .filter(({ isPreviousYear }) => !isPreviousYear)
                            .map((monthInfo, displayIndex) => {
                                const x0 = xScale(displayIndex) ?? 0;
                                const xCenter = x0 + bandWidth / 2;
                                const monthData = monthlyData[monthInfo.monthIndex];
                                if (!monthData) return null;
                                return (
                                    <React.Fragment key={`incidents-${displayIndex}`}>
                                        {monthData.warningIncidents > 0 && (
                                            <circle
                                                cx={xCenter}
                                                cy={incidentYScale(monthData.warningIncidents)}
                                                r={3}
                                                fill="var(--color-warning-400, #fb923c)"
                                            />
                                        )}
                                        {monthData.errorIncidents > 0 && (
                                            <circle
                                                cx={xCenter}
                                                cy={incidentYScale(monthData.errorIncidents)}
                                                r={3}
                                                fill="var(--color-negative, #ef4444)"
                                            />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                </Group>
                {/* X-axis: first letter of each month */}
                <Group left={margin.left} top={innerHeight - 20}>
                    {monthIndices.map((monthInfo, displayIndex) => {
                        const x0 = (xScale(displayIndex) ?? 0) + bandWidth / 2;
                        return (
                            <text
                                key={displayIndex}
                                x={x0}
                                y={14}
                                textAnchor="middle"
                                className="fill-[white] text-[10px] font-medium"
                            >
                                {MONTH_LETTERS[monthInfo.monthIndex]}
                            </text>
                        );
                    })}
                </Group>
            </svg>
        </div>
    );
};
