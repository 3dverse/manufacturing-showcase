//------------------------------------------------------------------------------
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faIndustry,
    faStar,
    faBoxesStacked,
    faHardHat,
    faCheckCircle,
    faTriangleExclamation,
    faXmarkCircle,
} from "@fortawesome/pro-solid-svg-icons";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";

//------------------------------------------------------------------------------
import type { KeyStatus, StatusScore } from "@/services/dashboardApi";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
const StatusScoreEnum = {
    1: "positive",
    2: "warning",
    3: "negative",
} as const;

//------------------------------------------------------------------------------
interface StatusIndicatorProps {
    index: number;
    label: string;
    score: StatusScore;
    icon: React.ReactNode;
}

//------------------------------------------------------------------------------
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ index, label, score, icon }) => {
    const color = StatusScoreEnum[score];

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center py-1 @md:px-3 appear-in-from-bottom duration-200 opacity-0",
            )}
            style={
                {
                    "--color": `var(--color-${color}-700)`,
                    "--animation-delay": `${index * 800}ms`,
                } as React.CSSProperties
            }
        >
            <div className="relative text-(--color)">
                <div className={cn("text-2xl opacity-60", score !== 1 ? "drop-shadow-[0_2px_10px_var(--color)]" : "")}>
                    {icon}
                </div>
                <div className="absolute -bottom-1 -right-3">
                    <Icon
                        icon={score === 1 ? faCheckCircle : score === 2 ? faTriangleExclamation : faXmarkCircle}
                        size="xs"
                        fixedWidth
                        className="aspect-square"
                    />
                </div>
            </div>
            <p className="text-xs font-medium tracking-wide text-(--color)">{label}</p>
        </div>
    );
};

//------------------------------------------------------------------------------
interface KeyStatusIndicatorsProps {
    keyStatus: KeyStatus;
    className?: string;
}

//------------------------------------------------------------------------------
export const KeyStatusIndicators: React.FC<KeyStatusIndicatorsProps> = ({ keyStatus }) => {
    return (
        <>
            <StatusIndicator
                index={1}
                label="Efficiency"
                score={keyStatus.efficiency}
                icon={<FontAwesomeIcon icon={faIndustry} />}
            />
            <StatusIndicator
                index={2}
                label="Quality"
                score={keyStatus.quality}
                icon={<FontAwesomeIcon icon={faStar} />}
            />
            <StatusIndicator
                index={3}
                label="Tracking"
                score={keyStatus.tracking}
                icon={<FontAwesomeIcon icon={faBoxesStacked} />}
            />
            <StatusIndicator
                index={4}
                label="Maintenance"
                score={keyStatus.maintenance}
                icon={<FontAwesomeIcon icon={faHardHat} />}
            />
        </>
    );
};
