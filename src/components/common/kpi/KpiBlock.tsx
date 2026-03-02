//------------------------------------------------------------------------------
import { scaleLinear } from "@visx/scale";
import { LinePath } from "@visx/shape";
import { curveLinear } from "@visx/curve";
import { Group } from "@visx/group";

//------------------------------------------------------------------------------
import { PanelLabel } from "@/components/common/panel";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
const SPARKLINE_WIDTH = 64;
const SPARKLINE_HEIGHT = 20;

//------------------------------------------------------------------------------
export function MiniSparkline({
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
export function KpiBlock({
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
        <div className="flex flex-col min-w-0">
            <PanelLabel className="text-2xs text-muted/90">{label}</PanelLabel>
            {subtitle && <p className="text-2xs text-muted/80">{subtitle}</p>}
            <div className="flex items-baseline justify-between gap-2">
                <span className={cn("text-xl font-semibold tabular-nums tracking-tight", valueClassName)}>
                    {value}
                    {unit && <span className="text-sm font-normal text-muted ml-0.5">{unit}</span>}
                </span>
                {sparklineData && sparklineData.length >= 2 && (
                    <MiniSparkline data={sparklineData} invert={sparklineInvert} />
                )}
            </div>
        </div>
    );
}
