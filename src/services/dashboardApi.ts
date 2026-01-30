//------------------------------------------------------------------------------
// Fake API service for dashboard data simulation
// Simulates real-life factory: one product finalized every 10s when running,
// only between 8am and 8pm. Production can be stopped (e.g. maintenance) via setProductionRunning(false).

/** Configure production schedule and simulated time so the demo always shows production when the page opens. */
export interface DashboardProductionConfig {
    /** One product every N ms when in shift. */
    productionIntervalMs: number;
    /** Shift start hour (0–23). Production runs from this hour inclusive. */
    shiftStartHour: number;
    /** Shift end hour (0–24). Production runs until this hour exclusive (e.g. 20 = 8pm end). */
    shiftEndHour: number;
    /**
     * Simulated hour (0–23) used for "within shift" check.
     * When set (e.g. 14 = 2pm), the demo always behaves as if it's that time → production runs.
     * When null, use real local time.
     */
    simulatedHour: number | null;
}

export const defaultProductionConfig: DashboardProductionConfig = {
    productionIntervalMs: 10_000, // 10 seconds
    shiftStartHour: 8,
    shiftEndHour: 20,
    simulatedHour: 14, // 2pm when page opens → always in shift, so we see production
};

export type StatusScore = 1 | 2 | 3; // 1 = ok, 2 = warning, 3 = error

export interface KeyStatus {
    efficiency: StatusScore;
    quality: StatusScore;
    tracking: StatusScore;
    maintenance: StatusScore;
}

/** Single source of truth: daily production record. */
export interface DailyProduction {
    /** Date (YYYY-MM-DD format for easy keying). */
    date: string;
    /** Total products produced this day. */
    products: number;
    /** Non-quality products produced this day. */
    nonQualityProducts: number;
    /** Total quality products produced this day. */
    qualityProducts: number;
}

/** Monthly production: 12 values (Jan–Dec). Used for charts. */
export interface MonthlyProductionSeries {
    thisYear: number[];
    previousYear: number[];
}

export interface DashboardData {
    keyStatus: KeyStatus;
    oee: number; // Overall Equipment Effectiveness (0-100)
    /** Total products finalized in the current month (live). */
    productMonth: number;
    /** Total products finalized in the previous month (fixed for % comparison). */
    productPreviousMonth: number;
    /** Total products finalized this year (live). */
    productYear: number;
    /** Total products finalized in the previous year (fixed for % comparison). */
    productPreviousYear: number;
    /** Last 30 days production (index 0 = 30 days ago). Kept for any legacy use. */
    monthlyProduction: number[];
    /** Monthly totals Jan–Dec: this year and previous year (~80 products/day last year, ~100 this year, current month ~110). */
    monthlyProductionSeries: MonthlyProductionSeries;
    /** Short month name for current month (e.g. "Jan"). */
    currentMonthLabel: string;
    /** Current month index (0–11, where 0 = January). */
    currentMonthIndex: number;
    nonQualityProduct: number; // percentage
    delays: {
        weeks: number;
        days: number;
    };
}

//------------------------------------------------------------------------------
class DashboardApiService {
    private baseOEE = 84; // Base OEE value (will vary between 80-88%)
    private oeeDailyHistory: Array<{ date: Date; value: number }> = [];
    private dailyIncidents: Array<{ date: Date; count: number }> = [];
    /** Daily incidents separated by type: warning and error. */
    private dailyIncidentsByType: Array<{ date: Date; warning: number; error: number }> = [];

    /** When false, no new product is finalized (e.g. maintenance). OEE reflects downtime. Enabled by default for demo. */
    private productionRunning = true;

    /** Single source of truth: daily production records for the past 2 years (~730 days). */
    private dailyProduction: Map<string, DailyProduction> = new Map();

    /** Last time we applied a production tick (1 product every 10s when running, in shift). */
    private lastProductionTick = 0;

    /** Production schedule and simulated time. Change to customize shift and "current" hour. */
    private productionConfig: DashboardProductionConfig;

    /** Key status change less often. */
    private lastStatusUpdate = 0;

    /** Get current hour in Paris timezone. */
    private static getParisHour(): number {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: "Europe/Paris",
            hour: "2-digit",
            hour12: false,
        });
        const parts = formatter.formatToParts(now);
        const hourPart = parts.find((p) => p.type === "hour");
        return hourPart ? parseInt(hourPart.value) : now.getHours();
    }

    /** Format date as YYYY-MM-DD for consistent keying. Uses local timezone. */
    private static formatDateKey(date: Date): string {
        // Normalize to local date to avoid timezone issues
        const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, "0");
        const day = String(localDate.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    /** Get or create daily production record for a date. */
    private getDailyProduction(date: Date): DailyProduction {
        // Normalize date to ensure consistent key format
        const normalizedDate = this.normalizeDate(date);
        const key = DashboardApiService.formatDateKey(normalizedDate);
        if (!this.dailyProduction.has(key)) {
            this.dailyProduction.set(key, {
                date: key,
                products: 0,
                nonQualityProducts: 0,
            });
        }
        return this.dailyProduction.get(key)!;
    }

    /** Initialize historical data: last 2 years of production. */
    private initializeHistoricalData(): void {
        const now = this.normalizeDate(new Date());
        const productsPerDayLastYear = 80;
        const productsPerDayThisYear = 100;
        const nonQualityRate = 0.04; // 4% non-quality

        // Calculate daily capacity (24 hours * products per hour)
        const secondsPerProduct = this.productionConfig.productionIntervalMs / 1000;
        const productsPerHour = 3600 / secondsPerProduct;
        const dailyCapacity = Math.round(24 * productsPerHour);

        // Initialize last 2 years (~730 days) with realistic production data
        for (let i = 730; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const normalizedDate = this.normalizeDate(date);
            const key = DashboardApiService.formatDateKey(normalizedDate);
            const year = normalizedDate.getFullYear();
            const currentYear = now.getFullYear();
            const productsPerDay = year < currentYear ? productsPerDayLastYear : productsPerDayThisYear;

            // Generate incidents first (they affect production)
            // 15% chance of warning incident, 5% chance of error incident
            const hasWarning = Math.random() < 0.15;
            const hasError = Math.random() < 0.05;
            const warningCount = hasWarning ? Math.floor(Math.random() * 4) + 1 : 0;
            const errorCount = hasError ? Math.floor(Math.random() * 3) + 1 : 0;

            // Machine stops/downtime based on incidents
            // Errors cause more downtime than warnings
            const downtimeFactor =
                errorCount > 0
                    ? 0.3 + Math.random() * 0.4 // 30-70% downtime with errors
                    : warningCount > 0
                      ? 0.1 + Math.random() * 0.2 // 10-30% downtime with warnings
                      : 0; // No downtime without incidents

            // Add some natural variation (±20%)
            const variation = 1 + (Math.random() - 0.5) * 0.4;
            const baseProducts = Math.round(productsPerDay * variation);

            // Reduce production based on downtime
            const actualProducts = Math.round(baseProducts * (1 - downtimeFactor));
            const nonQualityProducts = Math.round(actualProducts * nonQualityRate * (1 + (Math.random() - 0.5) * 0.5));

            this.dailyProduction.set(key, {
                date: key,
                products: actualProducts,
                nonQualityProducts,
                qualityProducts: actualProducts - nonQualityProducts,
            });

            // Store incidents for this day
            this.dailyIncidentsByType.push({
                date: normalizedDate,
                warning: warningCount,
                error: errorCount,
            });

            // Also store in dailyIncidents for backward compatibility
            this.dailyIncidents.push({
                date: normalizedDate,
                count: warningCount + errorCount,
            });
        }

        // Initialize daily OEE history (last 30 days)
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const normalizedDate = this.normalizeDate(date);

            // OEE between 80% and 88%
            const oeeValue = Math.max(80, Math.min(88, this.baseOEE + (Math.random() - 0.5) * 8));

            this.oeeDailyHistory.push({
                date: normalizedDate,
                value: oeeValue,
            });
        }
    }

    constructor(productionConfig: DashboardProductionConfig = defaultProductionConfig) {
        this.productionConfig = productionConfig;
        this.initializeHistoricalData();
    }

    /** Call when user simulates maintenance (e.g. Process disconnected). Stops new products. */
    setProductionRunning(running: boolean): void {
        this.productionRunning = running;
    }

    /** Update production config (shift hours, simulated time, interval). */
    setProductionConfig(config: Partial<DashboardProductionConfig>): void {
        const intervalChanged = config.productionIntervalMs !== undefined && 
            config.productionIntervalMs !== this.productionConfig.productionIntervalMs;
        this.productionConfig = { ...this.productionConfig, ...config };
        // Reset lastProductionTick when interval changes so new interval takes effect immediately
        if (intervalChanged) {
            this.lastProductionTick = Date.now();
        }
    }

    /** Current production config (e.g. for display or debugging). */
    getProductionConfig(): Readonly<DashboardProductionConfig> {
        return this.productionConfig;
    }

    /** True when current time is within shift (uses simulated hour if configured, otherwise Paris timezone). */
    private isWithinShift(): boolean {
        const hour =
            this.productionConfig.simulatedHour !== null
                ? this.productionConfig.simulatedHour
                : DashboardApiService.getParisHour();
        return hour >= this.productionConfig.shiftStartHour && hour < this.productionConfig.shiftEndHour;
    }

    /**
     * Call periodically from the UI (e.g. every 2s). Adds one finalized product when running
     * and within shift, every productionIntervalMs. Always adds one OEE sample.
     */
    tick(): void {
        const now = Date.now();
        if (this.lastProductionTick === 0) this.lastProductionTick = now;
        const elapsed = now - this.lastProductionTick;
        const inShift = this.isWithinShift();

        if (this.productionRunning && inShift && elapsed >= this.productionConfig.productionIntervalMs) {
            // Calculate how many products should be created based on elapsed time
            const productsToCreate = Math.floor(elapsed / this.productionConfig.productionIntervalMs);
            
            // Increment today's production - normalize date to ensure key consistency
            const today = this.normalizeDate(new Date());
            const dateKey = DashboardApiService.formatDateKey(today);
            const todayRecord = this.getDailyProduction(today);

            // Create the calculated number of products
            for (let i = 0; i < productsToCreate; i++) {
                // Increment products
                todayRecord.products += 1;

                // ~4% chance of non-quality product
                if (Math.random() < 0.04) {
                    todayRecord.nonQualityProducts += 1;
                }
            }

            // Map is already updated since we modified the object reference
            // But ensure it's set explicitly for clarity
            this.dailyProduction.set(dateKey, todayRecord);

            // Update lastProductionTick to account for the products created
            // This ensures we don't lose time when multiple products are created
            this.lastProductionTick = now - (elapsed % this.productionConfig.productionIntervalMs);
        } else if (!this.productionRunning) {
            this.lastProductionTick = now;
        }

        // Update today's OEE value (keep it between 80-88%)
        const today = this.normalizeDate(new Date());
        const todayOEEIndex = this.oeeDailyHistory.findIndex((d) => d.date.getTime() === today.getTime());

        if (todayOEEIndex >= 0) {
            const oeeVariation = (Math.random() - 0.5) * 4;
            const currentOEE = this.productionRunning
                ? Math.max(80, Math.min(88, this.baseOEE + oeeVariation))
                : Math.max(0, Math.min(100, 15 + (Math.random() - 0.5) * 10));
            this.oeeDailyHistory[todayOEEIndex].value = currentOEE;
        } else {
            // If today is not in history, add it and remove oldest
            const oeeVariation = (Math.random() - 0.5) * 4;
            const currentOEE = this.productionRunning
                ? Math.max(80, Math.min(88, this.baseOEE + oeeVariation))
                : Math.max(0, Math.min(100, 15 + (Math.random() - 0.5) * 10));
            this.oeeDailyHistory.push({ date: today, value: currentOEE });
            if (this.oeeDailyHistory.length > 30) this.oeeDailyHistory.shift();
        }

        // Update today's incidents (occasionally add an incident)
        const todayIncidentIndex = this.dailyIncidents.findIndex((d) => d.date.getTime() === today.getTime());
        if (todayIncidentIndex >= 0) {
            if (Math.random() > 0.98) {
                // Very rare chance to add an incident during the day
                this.dailyIncidents[todayIncidentIndex].count += 1;
            }
        } else {
            // If today is not in incidents history, add it and remove oldest
            this.dailyIncidents.push({ date: today, count: 0 });
            if (this.dailyIncidents.length > 30) this.dailyIncidents.shift();
        }

        // Update today's incidents by type
        const todayIncidentTypeIndex = this.dailyIncidentsByType.findIndex((d) => d.date.getTime() === today.getTime());
        if (todayIncidentTypeIndex >= 0) {
            if (Math.random() > 0.98) {
                // Very rare chance to add a warning incident
                this.dailyIncidentsByType[todayIncidentTypeIndex].warning += 1;
            }
            if (Math.random() > 0.99) {
                // Very rare chance to add an error incident
                this.dailyIncidentsByType[todayIncidentTypeIndex].error += 1;
            }
        } else {
            // If today is not in incidents history, add it and remove oldest
            this.dailyIncidentsByType.push({ date: today, warning: 0, error: 0 });
            if (this.dailyIncidentsByType.length > 30) this.dailyIncidentsByType.shift();
        }
    }

    /**
     * Manually add a new product to today's production.
     * Useful for testing or manual product creation.
     */
    addProduct(): void {
        const today = this.normalizeDate(new Date());
        const dateKey = DashboardApiService.formatDateKey(today);
        const todayRecord = this.getDailyProduction(today);

        // Increment products
        todayRecord.products += 1;

        // ~4% chance of non-quality product
        if (Math.random() < 0.04) {
            todayRecord.nonQualityProducts += 1;
        }

        // Update the map
        this.dailyProduction.set(dateKey, todayRecord);
    }

    /** Normalize date to midnight for accurate date comparisons. */
    private normalizeDate(date: Date): Date {
        const normalized = new Date(date);
        normalized.setHours(0, 0, 0, 0);
        return normalized;
    }

    /** Compute metrics from daily production records. */
    private computeMetrics() {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        // Get date ranges (normalized to midnight)
        const today = this.normalizeDate(now);
        const firstDayOfMonth = this.normalizeDate(new Date(currentYear, currentMonth, 1));
        const firstDayOfPreviousMonth = this.normalizeDate(new Date(currentYear, currentMonth - 1, 1));
        const lastDayOfPreviousMonth = this.normalizeDate(new Date(currentYear, currentMonth, 0));
        const firstDayOfYear = this.normalizeDate(new Date(currentYear, 0, 1));
        const firstDayOfPreviousYear = this.normalizeDate(new Date(currentYear - 1, 0, 1));
        const lastDayOfPreviousYear = this.normalizeDate(new Date(currentYear, 0, 0));

        // Aggregate daily records
        let productMonth = 0;
        let productPreviousMonth = 0;
        let productYear = 0;
        let productPreviousYear = 0;
        let totalProducts = 0;
        let totalNonQualityProducts = 0;

        const monthlyThisYear = Array(12).fill(0);
        const monthlyPreviousYear = Array(12).fill(0);
        const last30Days: number[] = Array(30).fill(0);

        // Iterate through all daily records
        for (const [dateKey, record] of this.dailyProduction.entries()) {
            const date = this.normalizeDate(new Date(dateKey + "T00:00:00"));
            const month = date.getMonth();

            // Current month (inclusive of today)
            if (date >= firstDayOfMonth && date <= today) {
                productMonth += record.products;
            }
            // Previous month
            if (date >= firstDayOfPreviousMonth && date <= lastDayOfPreviousMonth) {
                productPreviousMonth += record.products;
            }
            // Current year (inclusive of today)
            if (date >= firstDayOfYear && date <= today) {
                productYear += record.products;
                monthlyThisYear[month] += record.products;
            }
            // Previous year
            if (date >= firstDayOfPreviousYear && date <= lastDayOfPreviousYear) {
                productPreviousYear += record.products;
                monthlyPreviousYear[month] += record.products;
            }

            // Last 30 days for chart (index 0 = 30 days ago, 29 = today)
            const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff >= 0 && daysDiff < 30) {
                const index = 29 - daysDiff;
                if (index >= 0 && index < 30) {
                    last30Days[index] = record.products;
                }
            }

            // For non-quality percentage: use last 30 days
            if (daysDiff >= 0 && daysDiff < 30) {
                totalProducts += record.products;
                totalNonQualityProducts += record.nonQualityProducts;
            }
        }

        // Calculate non-quality percentage from last 30 days
        const nonQualityProduct = totalProducts > 0 ? (totalNonQualityProducts / totalProducts) * 100 : 0;

        return {
            productMonth,
            productPreviousMonth,
            productYear,
            productPreviousYear,
            monthlyThisYear,
            monthlyPreviousYear,
            last30Days, // Index 0 = 30 days ago, 29 = today
            nonQualityProduct,
        };
    }

    getDashboardData(): DashboardData {
        const now = Date.now();
        const today = this.normalizeDate(new Date());
        const todayOEE = this.oeeDailyHistory.find((d) => d.date.getTime() === today.getTime());
        const currentOEE = todayOEE ? todayOEE.value : this.baseOEE;

        // ---- Key status: change occasionally, not every 2s ----
        if (now - this.lastStatusUpdate > 10000) {
            this.lastStatusUpdate = now;
        }
        const getStatus = (): StatusScore => {
            // const rand = Math.random();
            // if (rand > 0.88) return 3;
            // if (rand > 0.7) return 2;
            return 1;
        };

        // Delays: stable, only change occasionally (e.g. once per minute)
        const delaysWeeks = Math.random() > 0.85 ? 1 : 0;
        const delaysDays = delaysWeeks > 0 ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 4);

        const currentMonthIndex = new Date().getMonth();
        const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        // Compute all metrics from daily production records
        const metrics = this.computeMetrics();

        return {
            keyStatus: {
                efficiency: getStatus(),
                quality: getStatus(),
                tracking: getStatus(),
                maintenance: this.productionRunning ? getStatus() : 2,
            },
            oee: Math.round(currentOEE * 10) / 10,
            productMonth: metrics.productMonth,
            productPreviousMonth: metrics.productPreviousMonth,
            productYear: metrics.productYear,
            productPreviousYear: metrics.productPreviousYear,
            monthlyProduction: metrics.last30Days,
            monthlyProductionSeries: {
                thisYear: metrics.monthlyThisYear,
                previousYear: metrics.monthlyPreviousYear,
            },
            currentMonthLabel: monthLabels[currentMonthIndex],
            currentMonthIndex,
            nonQualityProduct: Math.round(metrics.nonQualityProduct * 10) / 10,
            delays: { weeks: delaysWeeks, days: delaysDays },
        };
    }

    /** Get daily production records (for debugging or advanced use). */
    getDailyProductionRecords(): ReadonlyMap<string, DailyProduction> {
        return this.dailyProduction;
    }

    getOEEHistory(): Array<{ date: Date; value: number }> {
        return [...this.oeeDailyHistory];
    }

    getDailyIncidents(): Array<{ date: Date; count: number }> {
        return [...this.dailyIncidents];
    }

    /** Get daily production data for the last N days with quality breakdown and incidents. */
    getDailyProductionData(days: number = 7): Array<{
        date: Date;
        qualityProducts: number;
        nonQualityProducts: number;
        notProduced: number; // Capacity - actual production
        capacity: number; // Total production capacity for the day
        warningIncidents: number;
        errorIncidents: number;
    }> {
        const now = this.normalizeDate(new Date());
        const result: Array<{
            date: Date;
            qualityProducts: number;
            nonQualityProducts: number;
            notProduced: number;
            capacity: number;
            warningIncidents: number;
            errorIncidents: number;
        }> = [];

        // Calculate products per hour based on production config
        // If production runs 12 hours (8am-8pm), and produces 1 product every 10s:
        // products per hour = 3600s / 10s = 360 products/hour
        // But since it runs 24/7, capacity = 24 hours * products_per_hour
        const secondsPerProduct = this.productionConfig.productionIntervalMs / 1000;
        const productsPerHour = 3600 / secondsPerProduct; // products per hour
        const dailyCapacity = Math.round(24 * productsPerHour); // 24 hours * products per hour

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const normalizedDate = this.normalizeDate(date);
            const dateKey = DashboardApiService.formatDateKey(normalizedDate);
            const dailyRecord = this.dailyProduction.get(dateKey) || {
                date: dateKey,
                products: 0,
                nonQualityProducts: 0,
            };

            const qualityProducts = dailyRecord.products - dailyRecord.nonQualityProducts;
            const nonQualityProducts = dailyRecord.nonQualityProducts;
            const actualProduction = dailyRecord.products;
            const notProduced = Math.max(0, dailyCapacity - actualProduction);

            const incidentData = this.dailyIncidentsByType.find(
                (inc) => inc.date.getTime() === normalizedDate.getTime(),
            ) || { date: normalizedDate, warning: 0, error: 0 };

            result.push({
                date: normalizedDate,
                qualityProducts,
                nonQualityProducts,
                notProduced,
                capacity: dailyCapacity,
                warningIncidents: incidentData.warning,
                errorIncidents: incidentData.error,
            });
        }

        return result;
    }

    /** Get monthly production data for the current year with quality breakdown and incidents. */
    getMonthlyProductionData(): Array<{
        monthIndex: number; // 0-11
        qualityProducts: number;
        nonQualityProducts: number;
        notProduced: number; // Capacity - actual production
        capacity: number; // Total production capacity for the month
        warningIncidents: number;
        errorIncidents: number;
    }> {
        const now = this.normalizeDate(new Date());
        const currentYear = now.getFullYear();
        const result: Array<{
            monthIndex: number;
            qualityProducts: number;
            nonQualityProducts: number;
            notProduced: number;
            capacity: number;
            warningIncidents: number;
            errorIncidents: number;
        }> = Array(12)
            .fill(null)
            .map((_, monthIndex) => ({
                monthIndex,
                qualityProducts: 0,
                nonQualityProducts: 0,
                notProduced: 0,
                capacity: 0,
                warningIncidents: 0,
                errorIncidents: 0,
            }));

        // Calculate products per hour and daily capacity
        const secondsPerProduct = this.productionConfig.productionIntervalMs / 1000;
        const productsPerHour = 3600 / secondsPerProduct;
        const dailyCapacity = Math.round(24 * productsPerHour);

        // Aggregate daily records by month
        for (const [dateKey, record] of this.dailyProduction.entries()) {
            const date = this.normalizeDate(new Date(dateKey + "T00:00:00"));
            const month = date.getMonth();
            const year = date.getFullYear();

            if (year === currentYear) {
                const qualityProducts = record.products - record.nonQualityProducts;
                const nonQualityProducts = record.nonQualityProducts;

                result[month].qualityProducts += qualityProducts;
                result[month].nonQualityProducts += nonQualityProducts;
                result[month].capacity += dailyCapacity;
            }
        }

        // Calculate not produced for each month
        result.forEach((monthData) => {
            const actualProduction = monthData.qualityProducts + monthData.nonQualityProducts;
            monthData.notProduced = Math.max(0, monthData.capacity - actualProduction);
        });

        // Aggregate incidents by month
        this.dailyIncidentsByType.forEach((incident) => {
            const date = this.normalizeDate(incident.date);
            const month = date.getMonth();
            const year = date.getFullYear();

            if (year === currentYear && month >= 0 && month < 12) {
                result[month].warningIncidents += incident.warning;
                result[month].errorIncidents += incident.error;
            }
        });

        return result;
    }
}

export const dashboardApi = new DashboardApiService();
