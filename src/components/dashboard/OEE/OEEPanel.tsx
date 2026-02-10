//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import { Badge } from "@/components/common/Badge";

//------------------------------------------------------------------------------
import { OEEChart } from "./OEEChart";
import { OEEGauge } from "./OEEGauge";

//------------------------------------------------------------------------------
interface OEEPanelProps {
    oeeValue: number;
    oeeHistory: { date: Date; value: number }[];
    incidents?: { date: Date; count: number }[];
    className?: string;
}

//------------------------------------------------------------------------------
const OEEPanel: React.FC<OEEPanelProps> = ({ oeeValue, oeeHistory, incidents = [], className }) => {
    return (
        <div className={cn("bg-neutral-0", className)}>
            <div className="flex items-start justify-between pr-6 pt-3">
                <div>
                    <h3 className="text-2xl font-bold text-default">OEE</h3>
                    <Badge className="-translate-x-1">Last 30 days</Badge>
                </div>
                <div className="max-w-32 h-16 flex items-center gap-6">
                    <OEEGauge value={oeeValue} />
                </div>
            </div>
            <OEEChart data={oeeHistory} incidents={incidents} height={120} />
        </div>
    );
};

export default OEEPanel;
