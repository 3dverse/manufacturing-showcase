import React from "react";

//------------------------------------------------------------------------------
import { MetricCard } from "@/components/common/metrics/MetricCard";
import { PanelHeader } from "@/components/common/panel/PanelHeader";
import { MonthlyProductionChart } from "@/components/dashboard/production/MonthlyProductionChart";
import { DailyProductionChart } from "@/components/dashboard/production/DailyProductionChart";

//------------------------------------------------------------------------------
import { type DashboardData, type DailyProduction, type MonthlyProductionSeries } from "@/services/dashboardApi";

//------------------------------------------------------------------------------
interface ProductionPanelProps {
    data: DashboardData;
    dailyProductionData: DailyProduction[];
    monthlyProductionData: MonthlyProductionSeries;
    monthlyProductionCompare: boolean;
    setMonthlyProductionCompare: (compare: boolean) => void;
    className?: string;
}

//------------------------------------------------------------------------------
export const ProductionPanel: React.FC<ProductionPanelProps> = ({
    data,
    dailyProductionData,
    monthlyProductionData,
    monthlyProductionCompare,
    setMonthlyProductionCompare,
}) => {
    return (
        <div className="flex flex-col gap-2">
            <PanelHeader>Production</PanelHeader>

            <MetricCard
                title="Daily Production"
                value={
                    dailyProductionData.length > 0
                        ? dailyProductionData[dailyProductionData.length - 1]?.capacity || 0
                        : 0
                }
                timeFrame="Last 7 days"
                valueUnit="units/day capacity"
                metric={{
                    title: `Today`,
                    value:
                        dailyProductionData.length > 0
                            ? `${(dailyProductionData[dailyProductionData.length - 1]?.qualityProducts || 0).toLocaleString()} quality units`
                            : "0 units",
                    subtitle:
                        dailyProductionData.length > 0
                            ? `${(((dailyProductionData[dailyProductionData.length - 1]?.qualityProducts || 0) / (dailyProductionData[dailyProductionData.length - 1]?.capacity || 1)) * 100).toFixed(1)}% of capacity`
                            : undefined,
                    positive: true,
                }}
            >
                <DailyProductionChart data={dailyProductionData} height={48} />
            </MetricCard>

            <MetricCard
                title="Monthly Production"
                value={120}
                timeFrame="Last 12 months"
                valueUnit="units/month"
                metric={{
                    title: `This month (${data.currentMonthLabel})`,
                    value: `${data.productMonth.toLocaleString()} units`,
                    subtitle:
                        data.productPreviousMonth > 0
                            ? `${data.productMonth >= data.productPreviousMonth ? "+" : ""}${(
                                  ((data.productMonth - data.productPreviousMonth) / data.productPreviousMonth) *
                                  100
                              ).toFixed(1)}% vs previous month`
                            : undefined,
                    positive: data.productMonth >= data.productPreviousMonth,
                }}
                onMetricSubtitleHover={setMonthlyProductionCompare}
            >
                <MonthlyProductionChart
                    thisYear={data.monthlyProductionSeries.thisYear}
                    previousYear={data.monthlyProductionSeries.previousYear}
                    showCompare={monthlyProductionCompare}
                    currentMonthIndex={data.currentMonthIndex}
                    monthlyData={monthlyProductionData}
                    height={48}
                />
            </MetricCard>
        </div>
    );
};
