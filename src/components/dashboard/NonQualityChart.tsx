//------------------------------------------------------------------------------
import React from "react";
import { LinePath, AreaClosed } from "@visx/shape";
import { curveLinear } from "@visx/curve";
import { scaleLinear } from "@visx/scale";
import { Group } from "@visx/group";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
interface NonQualityChartProps {
    data: number[];
    width?: number;
    height?: number;
    className?: string;
}

//------------------------------------------------------------------------------
export const NonQualityChart: React.FC<NonQualityChartProps> = ({ data, width = 300, height = 80, className }) => {
    if (data.length === 0) return null;

    const margin = { top: 0, right: 0, bottom: 0, left: 0 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = scaleLinear({
        domain: [0, data.length - 1],
        range: [0, innerWidth],
    });

    const maxValue = Math.max(...data);
    const yScale = scaleLinear({
        domain: [0, maxValue * 1.2],
        range: [innerHeight, 0],
    });

    const chartData = data.map((value, i) => ({ x: i, y: value }));

    return (
        <div className={cn("w-full", className)}>
            <svg width={width} height={height}>
                <Group left={margin.left} top={margin.top}>
                    <AreaClosed
                        data={chartData}
                        x={(d) => xScale(d.x)}
                        y={(d) => yScale(d.y)}
                        yScale={yScale}
                        curve={curveLinear}
                        fill="#10b981"
                        fillOpacity={0.2}
                    />
                    <LinePath
                        data={chartData}
                        x={(d) => xScale(d.x)}
                        y={(d) => yScale(d.y)}
                        curve={curveLinear}
                        stroke="#10b981"
                        strokeWidth={2}
                    />
                </Group>
            </svg>
        </div>
    );
};
