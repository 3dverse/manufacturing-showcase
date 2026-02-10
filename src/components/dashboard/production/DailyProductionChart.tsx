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
interface DailyProductionData {
    date: Date;
    qualityProducts: number;
    nonQualityProducts: number;
    capacity: number;
    warningIncidents: number;
    errorIncidents: number;
}

interface DailyProductionChartProps {
    /** 7 days of production data (last 7 days). */
    data: DailyProductionData[];
    height?: number;
    className?: string;
}

//------------------------------------------------------------------------------
export const DailyProductionChart: React.FC<DailyProductionChartProps> = ({ data, height = 100, className }) => {
    const { width, parentRef } = useParentSize({ debounceTime: 150 });
    const [hoveredDay, setHoveredDay] = useState<{ index: number; x: number; y: number } | null>(null);

    const margin = { top: 0, right: 0, bottom: 0, left: 0 };
    const innerWidth = Math.max(0, width - margin.left - margin.right);
    const innerHeight = height - margin.top - margin.bottom;

    // Filter to ensure we have exactly 7 days
    const chartData = useMemo(() => {
        return data.slice(-7);
    }, [data]);

    // Calculate max value for y-scale (capacity or max production)
    const maxVal = useMemo(() => {
        if (chartData.length === 0) return 1;
        const values: number[] = [];
        chartData.forEach((day) => {
            values.push(day.capacity);
            values.push(day.qualityProducts + day.nonQualityProducts);
        });
        return Math.max(...values, 1);
    }, [chartData]);

    // Calculate max incidents for incident line scale
    const maxIncidents = useMemo(() => {
        if (chartData.length === 0) return 1;
        const values: number[] = [];
        chartData.forEach((day) => {
            values.push(day.warningIncidents);
            values.push(day.errorIncidents);
        });
        return Math.max(...values, 1);
    }, [chartData]);

    const yScale = useMemo(
        () =>
            scaleLinear({
                domain: [0, maxVal * 1.1 || 1],
                range: [innerHeight, 0],
            }),
        [maxVal, innerHeight],
    );

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

    const xScale = useMemo(
        () =>
            scaleBand({
                domain: chartData.map((_, i) => i),
                range: [0, innerWidth],
                padding: 0.1,
            }),
        [chartData, innerWidth],
    );

    if (chartData.length === 0) return null;

    const bandWidth = xScale.bandwidth();
    const barWidth = bandWidth * 0.8;

    const formatDayLabel = (date: Date): string => {
        const day = date.getDate();
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = monthNames[date.getMonth()];
        return `${day} ${month}`;
    };

    return (
        <div ref={parentRef} className={cn("w-full relative", className)}>
            {/* Tooltip */}
            {hoveredDay && (
                <div
                    className="absolute min-w-32 z-10 px-2 py-1 text-xs rounded shadow-lg bg-neutral-800 text-neutral-0 pointer-events-none"
                    style={{
                        left: hoveredDay.x,
                        top: hoveredDay.y,
                        transform: "translate(-50%, -75%)",
                    }}
                >
                    {(() => {
                        const dayData = chartData[hoveredDay.index];
                        return (
                            <>
                                <div className="font-semibold">{formatDayLabel(dayData.date)}</div>
                                <div className="text-green-400">
                                    Quality: {dayData.qualityProducts.toLocaleString()}
                                </div>
                                <div className="text-orange-400">
                                    Non-Quality: {dayData.nonQualityProducts.toLocaleString()}
                                </div>
                                <div className="mt-1 pt-1 border-t border-neutral-600">
                                    <div className="text-yellow-400">Warnings: {dayData.warningIncidents}</div>
                                    <div className="text-red-400">Errors: {dayData.errorIncidents}</div>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
                <Group left={margin.left} top={margin.top}>
                    {/* Stacked bars */}
                    {chartData.map((dayData, index) => {
                        const x0 = xScale(index) ?? 0;
                        const xCenter = x0 + bandWidth / 2;

                        // Calculate y positions for each segment (stacked from bottom to top)
                        // yScale returns the top y position for a given value
                        const orangeTop = yScale(dayData.nonQualityProducts); // Top of orange bar
                        const greenTop = yScale(dayData.qualityProducts + dayData.nonQualityProducts); // Top of green bar

                        // Heights (from top y position to bottom)
                        const orangeHeight = innerHeight - orangeTop;
                        const greenHeight = orangeTop - greenTop;

                        const handleMouseEnter = () => {
                            setHoveredDay({
                                index,
                                x: xCenter + margin.left,
                                y: margin.top - 8,
                            });
                        };

                        const handleMouseLeave = () => setHoveredDay(null);

                        return (
                            <Group key={index} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                                {/* Orange bar: Non-quality products (middle) */}
                                {dayData.nonQualityProducts > 0 && (
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
                                {dayData.qualityProducts > 0 && (
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
                    })}

                    {/* Warning incidents line */}
                    {maxIncidents > 0 && (
                        <LinePath
                            data={chartData}
                            x={(_, i) => (xScale(i) ?? 0) + bandWidth / 2}
                            y={(d) => incidentYScale(d.warningIncidents)}
                            curve={curveLinear}
                            stroke="var(--color-warning-400, #fb923c)"
                            strokeWidth={1}
                            strokeOpacity={0.9}
                        />
                    )}

                    {/* Error incidents line */}
                    {maxIncidents > 0 && (
                        <LinePath
                            data={chartData}
                            x={(_, i) => (xScale(i) ?? 0) + bandWidth / 2}
                            y={(d) => incidentYScale(d.errorIncidents)}
                            curve={curveLinear}
                            stroke="var(--color-negative, #ef4444)"
                            strokeWidth={1}
                            strokeOpacity={0.9}
                        />
                    )}

                    {/* Dots for incident lines */}
                    {maxIncidents > 0 &&
                        chartData.map((dayData, index) => {
                            const xCenter = (xScale(index) ?? 0) + bandWidth / 2;
                            return (
                                <React.Fragment key={`incidents-${index}`}>
                                    {dayData.warningIncidents > 0 && (
                                        <circle
                                            cx={xCenter}
                                            cy={incidentYScale(dayData.warningIncidents)}
                                            r={3}
                                            fill="var(--color-warning-400, #fb923c)"
                                        />
                                    )}
                                    {dayData.errorIncidents > 0 && (
                                        <circle
                                            cx={xCenter}
                                            cy={incidentYScale(dayData.errorIncidents)}
                                            r={3}
                                            fill="var(--color-negative, #ef4444)"
                                        />
                                    )}
                                </React.Fragment>
                            );
                        })}
                </Group>
                {/* X-axis: day labels */}
                <Group left={margin.left} top={innerHeight - 20}>
                    {chartData.map((dayData, index) => {
                        const x0 = (xScale(index) ?? 0) + bandWidth / 2;
                        return (
                            <text
                                key={index}
                                x={x0}
                                y={14}
                                textAnchor="middle"
                                className="fill-[white] text-[10px] font-medium"
                            >
                                {formatDayLabel(dayData.date)}
                            </text>
                        );
                    })}
                </Group>
            </svg>
        </div>
    );
};
