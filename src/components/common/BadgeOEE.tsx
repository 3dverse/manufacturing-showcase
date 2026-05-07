import { cn } from "@/utils/cn";
import { Badge } from "./Badge";
import { MiniSparkline } from "./metrics/MetricBlock";
import { Triangle } from "./icons/Triangle";

export const BadgeOEE = ({
    oee,
    oeeHistory,
    className,
    hideLabel = false,
    hasStoppage = false,
}: {
    oee: number;
    oeeHistory?: number[];
    className?: string;
    hideLabel?: boolean;
    hasStoppage?: boolean;
}) => {
    const hasHistory = oeeHistory && oeeHistory.length >= 2;
    return (
        <Badge
            variant="positive"
            className={cn(
                "flex justify-center items-center gap-2",
                hasStoppage && "!bg-warning/30 !text-warning",
                className,
            )}
        >
            <div className="flex flex-col items-start">
                {!hideLabel && (
                    <span
                        className={cn(
                            "text-[40%] leading-tight",
                            hasStoppage ? "text-warning-200" : "text-positive-200",
                        )}
                    >
                        OEE
                    </span>
                )}
                <p className="font-semibold leading-none">
                    {oee}
                    <span
                        className={cn(
                            "text-[50%] leading-tight ml-[.5ex]",
                            hasStoppage ? "text-warning-500" : "text-positive-500",
                        )}
                    >
                        %
                    </span>
                </p>
            </div>
            {hasHistory ? (
                <MiniSparkline
                    data={oeeHistory}
                    color={hasStoppage ? "var(--color-warning)" : "var(--color-positive)"}
                />
            ) : (
                <Triangle className={cn(hasStoppage ? "rotate-180 bg-warning-600" : "bg-positive-700")} />
            )}
        </Badge>
    );
};
