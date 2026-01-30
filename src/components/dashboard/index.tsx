import React, { useState, useEffect } from "react";

//------------------------------------------------------------------------------
import Button from "@/components/common/Button";
import { WrapperPanel } from "@/components/common/panel/WrapperPanel";
import RefreshNotifier from "@/components/common/RefreshNotifier";

//------------------------------------------------------------------------------
import { Header } from "./header/Header";
import OEEPanel from "./OEE/OEEPanel";
import { PlanningPanel } from "./planning/PlanningPanel";
import { ProductionPanel } from "./production/ProductionPanel";

//------------------------------------------------------------------------------
import { dashboardApi, type DashboardData, type DailyProduction } from "@/services/dashboardApi";
import type { Factory } from "@/content/factory";

//------------------------------------------------------------------------------
interface LiveDashboardProps {
    factory: Factory;
}

//------------------------------------------------------------------------------
export const LiveDashboard: React.FC<LiveDashboardProps> = ({ factory }) => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [oeeHistory, setOeeHistory] = useState<Array<{ date: Date; value: number }>>([]);
    const [dailyIncidents, setDailyIncidents] = useState<Array<{ date: Date; count: number }>>([]);
    const [dailyProductionData, setDailyProductionData] = useState<
        Array<{
            date: Date;
            qualityProducts: number;
            nonQualityProducts: number;
            notProduced: number;
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
            notProduced: number;
            capacity: number;
            warningIncidents: number;
            errorIncidents: number;
        }>
    >([]);
    const [monthlyProductionCompare, setMonthlyProductionCompare] = useState(false);
    const [productionIntervalMs, setProductionIntervalMs] = useState(() => 
        dashboardApi.getProductionConfig().productionIntervalMs
    );

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

    useEffect(() => {
        updateData();
        const interval = setInterval(updateData, productionIntervalMs);
        return () => clearInterval(interval);
    }, [productionIntervalMs]);

    // Handler for manually adding a product
    const handleAddProduct = () => {
        dashboardApi.addProduct();
        updateData(); // Immediately refresh the dashboard
    };

    if (!data) {
        return (
            <div className="p-4">
                <div className="text-center text-subtle">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full grow overflow-y-hidden">
            <Header factory={factory} keyStatus={data.keyStatus} />

            <WrapperPanel className="p-0 flex flex-col overflow-y-auto overflow-x-hidden">
                
                <OEEPanel oeeValue={data.oee} oeeHistory={oeeHistory} incidents={dailyIncidents} className="pl-15" />

                <div className="flex flex-col gap-5 mt-5 pl-15 pr-4">
                    <PlanningPanel dailyProductionData={dailyProductionData as unknown as DailyProduction[]} />

                    <ProductionPanel
                        data={data}
                        dailyProductionData={dailyProductionData as unknown as DailyProduction[]}
                        monthlyProductionData={data.monthlyProductionSeries}
                        monthlyProductionCompare={monthlyProductionCompare}
                        setMonthlyProductionCompare={setMonthlyProductionCompare}
                    />

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
                                className="w-24 px-2 py-1 text-2xs border border-muted/50 rounded bg-neutral-0 text-default focus:outline-none focus:ring-2 focus:ring-accent-500/50"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <p className="text-2xs text-muted/80">Updated every {productionIntervalMs / 1000}s</p>
                            <RefreshNotifier refreshRate={productionIntervalMs} />
                        </div>
                    </div>

                    {handleAddProduct && (
                        <Button variant="primary" size="sm" onClick={handleAddProduct}>
                            New product created
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
            </WrapperPanel>
        </div>
    );
};
