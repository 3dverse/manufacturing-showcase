//------------------------------------------------------------------------------
import React, { useState, useCallback } from "react";
import { LinePath, AreaClosed } from "@visx/shape";
import { curveLinear } from "@visx/curve";
import { scaleTime, scaleLinear } from "@visx/scale";
import { AxisTop, AxisLeft } from "@visx/axis";
import { GridRows, GridColumns } from "@visx/grid";
import { Group } from "@visx/group";
import { useParentSize } from "@visx/responsive";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
interface OEEChartProps {
    data: Array<{ date: Date; value: number }>;
    incidents?: Array<{ date: Date; count: number }>;
    height?: number;
    className?: string;
}

const OEE_Y_MIN = 50;
const OEE_Y_MAX = 100;
const CHART_HEIGHT = 120;
const margin = { top: 0, right: 0, bottom: 0, left: 0 };

function formatDayLabel(d: Date): string {
    const day = d.getDate();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[d.getMonth()];
    return `${day} ${month}`;
}

function formatTooltipDate(d: Date): string {
    return d.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

const showGradation = false;

//------------------------------------------------------------------------------
export const OEEChart: React.FC<OEEChartProps> = ({ data, incidents = [], height = CHART_HEIGHT, className }) => {
    const [hovered, setHovered] = useState<{ date: Date; value: number; incidentCount?: number } | null>(null);
    const { width, parentRef } = useParentSize({ debounceTime: 150 });

    const innerWidth = Math.max(0, width - margin.left - margin.right);
    const innerHeight = height - margin.top - margin.bottom;

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<SVGRectElement>) => {
            if (data.length === 0 || innerWidth <= 0) return;
            const dateExtent = [
                Math.min(...data.map((d) => d.date.getTime())),
                Math.max(...data.map((d) => d.date.getTime())),
            ] as [number, number];
            const xScale = scaleTime({ domain: dateExtent, range: [0, innerWidth] });
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left - margin.left;
            const t = xScale.invert(x);
            const tMs = t.getTime();
            let idx = 0;
            let best = Math.abs(data[0].date.getTime() - tMs);
            for (let i = 1; i < data.length; i++) {
                const d = Math.abs(data[i].date.getTime() - tMs);
                if (d < best) {
                    best = d;
                    idx = i;
                }
            }
            const hoveredData = data[idx];
            const incidentData = incidents.find((inc) => inc.date.getTime() === hoveredData.date.getTime());
            setHovered({
                date: hoveredData.date,
                value: hoveredData.value,
                incidentCount: incidentData?.count,
            });
        },
        [data, incidents, innerWidth],
    );

    const handleMouseLeave = useCallback(() => setHovered(null), []);

    const dateExtent: [number, number] =
        data.length > 0
            ? [Math.min(...data.map((d) => d.date.getTime())), Math.max(...data.map((d) => d.date.getTime()))]
            : [Date.now(), Date.now()];
    const valueExtent = [OEE_Y_MIN, OEE_Y_MAX] as [number, number];

    // Scale for incidents: display in bottom 25% of chart (0 to max incidents)
    const maxIncidents = incidents.length > 0 ? Math.max(...incidents.map((d) => d.count), 1) : 1;
    const incidentBottom = innerHeight * 0.75; // Bottom 25% of chart
    const incidentYScale = scaleLinear({ domain: [0, maxIncidents], range: [innerHeight, incidentBottom] });

    const xScale = scaleTime({ domain: dateExtent, range: [0, innerWidth] });
    const yScale = scaleLinear({ domain: valueExtent, range: [innerHeight, 0] });

    const hasData = data.length > 0 && width > 0;

    return (
        <div ref={parentRef} className={cn("w-full relative", className)}>
            {hasData && hovered && (
                <div
                    className="absolute z-10 px-2 py-1 text-xs rounded shadow-lg bg-neutral-900 text-neutral-0 pointer-events-none"
                    style={{
                        left: margin.left + xScale(hovered.date.getTime()),
                        top: margin.top + yScale(hovered.value) - 8,
                        transform: "translate(-50%, -100%)",
                    }}
                >
                    <div>{formatTooltipDate(hovered.date)}</div>
                    <div className="font-semibold tabular-nums">OEE: {hovered.value.toFixed(1)}%</div>
                    {hovered.incidentCount !== undefined && hovered.incidentCount > 0 && (
                        <div className="text-orange-400">Incidents: {hovered.incidentCount}</div>
                    )}
                </div>
            )}
            {hasData && (
                <svg width={width} height={height}>
                    <Group left={margin.left} top={margin.top}>
                        {showGradation && (
                            <>
                                <GridRows
                                    scale={yScale}
                                    width={innerWidth}
                                    stroke="var(--color-neutral-200)"
                                    strokeDasharray="2,2"
                                />
                                <GridColumns
                                    scale={xScale}
                                    height={innerHeight}
                                    stroke="var(--color-neutral-200)"
                                    strokeDasharray="2,2"
                                />
                            </>
                        )}

                        <AreaClosed
                            data={data}
                            x={(d) => xScale(d.date.getTime())}
                            y={(d) => yScale(d.value)}
                            yScale={yScale}
                            curve={curveLinear}
                            fill="var(--color-positive)"
                            fillOpacity={0.1}
                        />
                        <LinePath
                            data={data}
                            x={(d) => xScale(d.date.getTime())}
                            y={(d) => yScale(d.value)}
                            curve={curveLinear}
                            stroke="var(--color-positive)"
                            strokeWidth={1}
                        />
                        {/* Add dots for each day */}
                        {showGradation &&
                            data.map((d, i) => (
                                <circle
                                    key={i}
                                    cx={xScale(d.date.getTime())}
                                    cy={yScale(d.value)}
                                    r={1}
                                    fill="var(--color-positive)"
                                />
                            ))}
                        {/* Incidents line (orange) */}
                        {incidents.length > 0 && (
                            <>
                                <AreaClosed
                                    data={incidents}
                                    x={(d) => xScale(d.date.getTime())}
                                    y={(d) => incidentYScale(d.count)}
                                    yScale={incidentYScale}
                                    curve={curveLinear}
                                    fill="var(--color-warning)"
                                    fillOpacity={0.1}
                                />
                                <LinePath
                                    data={incidents}
                                    x={(d) => xScale(d.date.getTime())}
                                    y={(d) => incidentYScale(d.count)}
                                    curve={curveLinear}
                                    stroke="orange"
                                    strokeWidth={1}
                                    // strokeOpacity={0.7}
                                />
                            </>
                        )}

                        <AxisTop
                            top={innerHeight}
                            scale={xScale}
                            tickFormat={(d) => {
                                const date = new Date(Number(d));
                                return formatDayLabel(date);
                            }}
                            strokeWidth={0}
                            tickLabelProps={() => ({
                                fill: "var(--color-muted)",
                                fontSize: 10,
                                textAnchor: "middle",
                                dy: 3,
                            })}
                            numTicks={6}
                        />
                        <AxisLeft
                            scale={yScale}
                            tickFormat={(d) => `${d}%`}
                            strokeWidth={0}
                            stroke="var(--color-neutral-400)"
                            tickStroke="var(--color-neutral-400)"
                            tickLabelProps={() => ({
                                fill: "var(--color-muted)",
                                fontSize: 10,
                                textAnchor: "start",
                                dx: 12,
                            })}
                            numTicks={3}
                        />
                    </Group>
                    <rect
                        x={margin.left}
                        y={margin.top}
                        width={innerWidth}
                        height={innerHeight}
                        fill="transparent"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                    />
                </svg>
            )}
        </div>
    );
};
