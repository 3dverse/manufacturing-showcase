import { cn } from "@/utils/cn";
import { Badge } from "./Badge";
import { MiniSparkline } from "./metrics/MetricBlock";

export const BadgeOEE = ({
    oee,
    oeeHistory,
    className,
    hideLabel = false,
}: {
    oee: number;
    oeeHistory?: number[];
    className?: string;
    hideLabel?: boolean;
}) => {
    const hasHistory = oeeHistory && oeeHistory.length >= 2;
    return (
        <Badge variant="positive" className={cn("flex justify-center items-center gap-2", className)}>
            <div className="flex flex-col items-start">
                {!hideLabel && <span className="text-[50%] leading-tight text-neutral-0">OEE</span>}
                <p className="font-semibold leading-none">
                    {oee}
                    <span className="text-[50%] leading-tight text-neutral-0 ml-[.5ex]">%</span>
                </p>
            </div>
            {hasHistory && <MiniSparkline data={oeeHistory} color="var(--color-neutral-0)" className="opacity-60" />}
        </Badge>
    );
};
