import React from "react";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
interface DelaysIndicatorProps {
    weeks: number;
    days: number;
    className?: string;
}

//------------------------------------------------------------------------------
export const DelaysIndicator: React.FC<DelaysIndicatorProps> = ({ weeks, days, className }) => {
    const totalDays = weeks * 7 + days;
    const maxValue = 14; // 2 weeks max for visualization

    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex items-center gap-2">
                <span className="text-xs text-subtle">Delays</span>
                <span className="text-green-600 text-xs">↑</span>
            </div>
            <div className="relative h-6 bg-slate-100 rounded-full overflow-hidden">
                {/* Red segment (1 week) */}
                <div className="absolute left-0 h-full bg-red-500" style={{ width: `${(7 / maxValue) * 100}%` }}>
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-white font-medium">
                        1 week
                    </span>
                </div>
                {/* Green segment */}
                <div
                    className="absolute right-0 h-full bg-green-500"
                    style={{ width: `${((maxValue - 7) / maxValue) * 100}%` }}
                >
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white font-medium">0</span>
                </div>
            </div>
            {totalDays > 0 && <div className="text-xs text-green-600 font-medium">+ {totalDays} days buffer</div>}
        </div>
    );
};
