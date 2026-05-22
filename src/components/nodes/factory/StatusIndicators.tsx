//------------------------------------------------------------------------------
import React, { useContext } from "react";
import {
    FaBoxes,
    FaCheckCircle,
    FaExclamationTriangle,
    FaHardHat,
    FaIndustry,
    FaStar,
    FaTimesCircle,
} from "react-icons/fa";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";
import { ScenarioContext } from "@/contexts/ScenariosContext";

//------------------------------------------------------------------------------
import type { KeyStatus, StatusScore } from "@/services/dashboardApi";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
type KpiOverride = Partial<Record<"efficiency" | "quality" | "tracking" | "maintenance", StatusScore>>;

const SCENARIO_KPI_OVERRIDES: Record<string, KpiOverride> = {
    corrective_maintenance: { maintenance: 3 },
    predictive_maintenance: { efficiency: 2, maintenance: 2 },
    planned_maintenance: { maintenance: 1 },
};

const STEP_KPI_OVERRIDES: Record<string, KpiOverride> = {
    "corrective_maintenance:step_10": { maintenance: 2 },
    "predictive_maintenance:step_1": { efficiency: 2, maintenance: 1 },
};

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
                    "--color": `var(--color-${color}-500)`,
                    "--animation-delay": `${index * 800}ms`,
                } as React.CSSProperties
            }
        >
            <div className="relative text-(--color)">
                <div className={cn("text-xl opacity-90", score !== 1 ? "drop-shadow-[0_2px_10px_var(--color)]" : "")}>
                    {icon}
                </div>
                <div className="absolute -bottom-1 -right-3">
                    <Icon
                        icon={score === 1 ? FaCheckCircle : score === 2 ? FaExclamationTriangle : FaTimesCircle}
                        size="xs"
                        fixedWidth
                        className="aspect-square"
                    />
                </div>
            </div>
            <p className="text-2xs font-normal tracking-wide text-accent-200">{label}</p>
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
    const { activeScenarioId, activeStepId } = useContext(ScenarioContext);
    const stepKey = activeScenarioId && activeStepId ? `${activeScenarioId}:${activeStepId}` : null;
    const overrides: KpiOverride = {
        ...(activeScenarioId ? SCENARIO_KPI_OVERRIDES[activeScenarioId] : {}),
        ...(stepKey ? STEP_KPI_OVERRIDES[stepKey] : {}),
    };

    return (
        <>
            <StatusIndicator
                index={1}
                label="Efficiency"
                score={overrides.efficiency ?? keyStatus.efficiency}
                icon={<FaIndustry />}
            />
            <StatusIndicator
                index={2}
                label="Quality"
                score={overrides.quality ?? keyStatus.quality}
                icon={<FaStar />}
            />
            <StatusIndicator
                index={3}
                label="Tracking"
                score={overrides.tracking ?? keyStatus.tracking}
                icon={<FaBoxes />}
            />
            <StatusIndicator
                index={4}
                label="Maintenance"
                score={overrides.maintenance ?? keyStatus.maintenance}
                icon={<FaHardHat />}
            />
        </>
    );
};
