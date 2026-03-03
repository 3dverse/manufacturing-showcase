//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import { Gauge } from "@/components/common/metrics/Gauge";
import { Badge } from "@/components/common/Badge";

//------------------------------------------------------------------------------
import { OEEChart } from "./OEEChart";

//------------------------------------------------------------------------------
interface OEEPanelProps {
    oeeValue: number;
    oeeHistory: { date: Date; value: number }[];
    incidents?: { date: Date; count: number }[];
    paddingLeftClassName?: string;
    className?: string;
}

//------------------------------------------------------------------------------
const OEEPanel: React.FC<OEEPanelProps> = ({
    oeeValue,
    oeeHistory,
    incidents = [],
    paddingLeftClassName,
    className,
}) => {
    return (
        <article className={cn("bg-neutral-0/50", className)}>
            <div className={cn("flex items-start justify-between pr-6 pt-3", paddingLeftClassName)}>
                <div>
                    <h3 className="text-2xl font-bold text-default">OEE</h3>
                    <Badge className="-translate-x-1">Last 30 days</Badge>
                </div>
                <div className="max-w-32 h-16 flex items-center gap-6">
                    <Gauge value={oeeValue} />
                </div>
            </div>
            <OEEChart data={oeeHistory} incidents={incidents} height={80} />
        </article>
    );
};

export default OEEPanel;
