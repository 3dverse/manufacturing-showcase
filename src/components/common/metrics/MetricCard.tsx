import React from "react";

//------------------------------------------------------------------------------
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
interface MetricCardProps {
    title: string;
    value: string | number;
    valueUnit?: string;
    timeFrame?: string;
    trend?: {
        value: number;
        label: string;
        positive?: boolean;
    };
    metric?: {
        title: string;
        value: string | number;
        subtitle?: string;
        positive?: boolean;
    };
    /** When provided with metric, called when user hovers the metric subtitle (e.g. to toggle chart compare mode). */
    onMetricSubtitleHover?: (hovered: boolean) => void;
    children?: React.ReactNode;
    className?: string;
}

//------------------------------------------------------------------------------
export const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    valueUnit,
    timeFrame,
    trend,
    metric,
    onMetricSubtitleHover,
    children,
    className,
}) => {
    return (
        <Card className={cn("", className)}>
            <div className="flex justify-between px-2 py-1">
                <div>
                    <div className="flex items-baseline gap-2">
                        {title && <p className="text-xs">{title}</p>}
                        {timeFrame && <Badge className="-translate-x-1 mb-1">{timeFrame}</Badge>}
                    </div>
                    <p className="font-family-heading text-xl leading-none tabular-nums font-semibold tracking-tight mb-px">
                        {value} <span className="font-family-sans font-normal text-sm">{valueUnit}</span>
                    </p>

                    {trend && (
                        <div
                            className={cn(
                                "text-xs",
                                trend.positive
                                    ? "text-green-700 dark:text-green-400"
                                    : "text-red-700 dark:text-red-400",
                            )}
                        >
                            {trend.positive ? "+" : ""}
                            {trend.value}% {trend.label}
                        </div>
                    )}
                </div>
                {metric && (
                    <div className="flex items-start gap-2 mr-1 mt-2">
                        <div className="text-right">
                            <p className="text-2xs text-accent-500">{metric.title}</p>
                            <p className="font-family-heading text-xl leading-none tabular-nums font-semibold tracking-tight">
                                {metric.value}
                            </p>
                            {metric.subtitle && (
                                <p
                                    className={cn(
                                        "text-2xs my-1 cursor-default",
                                        metric.positive !== false ? "text-positive-700" : "text-negative-700",
                                    )}
                                    onMouseEnter={() => onMetricSubtitleHover?.(true)}
                                    onMouseLeave={() => onMetricSubtitleHover?.(false)}
                                >
                                    {metric.subtitle}
                                </p>
                            )}
                        </div>
                        <span className="mt-6 relative w-1 aspect-square bg-neutral-600 rounded-full before:content-[''] before:block before:absolute before:top-0 before:left-[2px] before:-translate-x-1/2 before:w-px before:h-10 before:bg-neutral-400 before:z-[-1]" />
                    </div>
                )}
            </div>

            {children}
        </Card>
    );
};
