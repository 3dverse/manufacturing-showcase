import React, { useState, useEffect } from "react";

//------------------------------------------------------------------------------
import Button from "@/components/common/Button";
import { PanelWrapper } from "@/components/common/panel/PanelWrapper";
import RefreshNotifier from "@/components/common/RefreshNotifier";

//------------------------------------------------------------------------------
import { Header } from "./header/Header";
import OEEPanel from "./OEE/OEEPanel";
import { ProductionAreaSummary } from "@/components/nodes/areas/production/ProductionAreaSummary";
import { PlanningPanel } from "../orders/PlanningPanel";
import { ProductionPanel } from "./production/ProductionPanel";

//------------------------------------------------------------------------------
import { dashboardApi, type DashboardData } from "@/services/dashboardApi";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export const LiveDashboard: React.FC = () => {
    //--------------------------------------------------------------------------
    const [data, setData] = useState<DashboardData | null>(null);
    const [oeeHistory, setOeeHistory] = useState<Array<{ date: Date; value: number }>>([]);
    const [dailyIncidents, setDailyIncidents] = useState<Array<{ date: Date; count: number }>>([]);
    const [dailyProductionData, setDailyProductionData] = useState<
        Array<{
            date: Date;
            qualityProducts: number;
            nonQualityProducts: number;
            capacity: number;
            warningIncidents: number;
            errorIncidents: number;
        }>
    >([]);
    const [monthlyProductionData, setMonthlyProductionData] = useState<
        Array<{
            monthIndex: number;
            qualityProducts: number;
            nonQualityProducts: number;
            capacity: number;
            warningIncidents: number;
            errorIncidents: number;
        }>
    >([]);
    const [productionIntervalMs, setProductionIntervalMs] = useState(
        () => dashboardApi.getProductionConfig().productionIntervalMs,
    );

    //--------------------------------------------------------------------------
    // Factory tick: one product every 10s when running and 8am–8pm; dashboard refreshes every 2s
    const updateData = () => {
        dashboardApi.tick(); // adds 1 product every 10s when in shift, 1 OEE sample
        setData(dashboardApi.getDashboardData());
        setOeeHistory(dashboardApi.getOEEHistory());
        setDailyIncidents(dashboardApi.getDailyIncidents());
        setDailyProductionData(dashboardApi.getDailyProductionData(7));
        setMonthlyProductionData(dashboardApi.getMonthlyProductionData());
    };

    // Handler for production interval change
    const handleProductionIntervalChange = (value: number) => {
        const newValue = Math.max(100, value); // Minimum 100ms
        setProductionIntervalMs(newValue);
        dashboardApi.setProductionConfig({ productionIntervalMs: newValue });
    };

    // Handler for manually adding a product
    const handleAddProduct = () => {
        dashboardApi.addProduct();
        updateData(); // Immediately refresh the dashboard
    };

    //--------------------------------------------------------------------------
    useEffect(() => {
        updateData();
        const interval = setInterval(updateData, productionIntervalMs);
        return () => clearInterval(interval);
    }, [productionIntervalMs]);

    //--------------------------------------------------------------------------
    const paddingLeftClassName = "pl-15";

    //--------------------------------------------------------------------------
    if (!data) {
        return (
            <div className="p-4">
                <div className="text-center text-subtle">Loading dashboard...</div>
            </div>
        );
    }
    //--------------------------------------------------------------------------
    return (
        <div className="flex flex-col h-full grow overflow-y-hidden">
            <Header keyStatus={data.keyStatus} />
            <PanelWrapper className="p-0 flex flex-col overflow-y-auto overflow-x-hidden divide-y divide-slate-0">
                <OEEPanel
                    oeeValue={data.oee}
                    oeeHistory={oeeHistory}
                    incidents={dailyIncidents}
                    className="border-b border-slate-0"
                    paddingLeftClassName={paddingLeftClassName}
                />
                <article className={cn("py-4 pr-4", paddingLeftClassName)}>
                    <ProductionAreaSummary />
                </article>
                <article className={cn("py-4 pr-4", paddingLeftClassName)}>
                    <PlanningPanel />
                </article>
                <article className="flex flex-col gap-5 py-4 pl-15 pr-4">
                    <ProductionPanel
                        data={data}
                        dailyProductionData={dailyProductionData}
                        monthlyProductionDetailedData={monthlyProductionData}
                    />
                </article>
                <div className="flex flex-col gap-5 py-4 pl-15 pr-4">
                    <div className="flex flex-col gap-2 mb-1">
                        <div className="flex items-center justify-end gap-2">
                            <label htmlFor="production-interval" className="text-2xs text-muted/80">
                                Production interval (ms):
                            </label>
                            <input
                                id="production-interval"
                                type="number"
                                min="100"
                                step="100"
                                value={productionIntervalMs}
                                onChange={(e) => handleProductionIntervalChange(Number(e.target.value))}
                                className="w-24 px-2 py-1 text-2xs border border-muted/50 rounded bg-neutral-0 text-default focus:outline-none focus:ring-2 focus:ring-accent/50"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <p className="text-2xs text-muted/80">Updated every {productionIntervalMs / 1000}s</p>
                            <RefreshNotifier refreshRate={productionIntervalMs} />
                        </div>
                    </div>
                    {handleAddProduct && (
                        <Button variant="primary" size="sm" onClick={handleAddProduct}>
                            Create new unit
                        </Button>
                    )}
                </div>

                {/* {false && (
                    <>
                        <MetricCard
                            title="Non-Quality Product"
                            value={`${data.nonQualityProduct}%`}
                            subtitle={`${(data.nonQualityProduct + 0.6).toFixed(1)}% last month`}
                        >
                            <NonQualityChart data={nonQualityHistory} width={320} height={56} />
                        </MetricCard>

                        <MetricCard title="Delays" value="">
                            <DelaysIndicator weeks={data.delays.weeks} days={data.delays.days} />
                        </MetricCard>
                    </>
                )} */}
            </PanelWrapper>
        </div>
    );
};
