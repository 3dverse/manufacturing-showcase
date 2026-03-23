//------------------------------------------------------------------------------
import { useMemo, useRef, useEffect } from "react";

//------------------------------------------------------------------------------
import Tooltip from "@/components/common/Tooltip/Tooltip";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import { orders } from "@/content/orders";
import type { Order } from "@/content/type";

//------------------------------------------------------------------------------
const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHS_TOTAL = 12;
const COLUMN_WIDTH_PX = 12;

export type MachineStop = {
    startDate: Date;
    endDate: Date;
    reason?: string;
};

/** PO number from start/end date: PO-YYYY-NNN (NNN = day of year from start) */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- end kept for API clarity
function ofNumberFromDates(start: Date, _end: Date): string {
    const y = start.getFullYear();
    const startOfYear = new Date(y, 0, 0);
    const dayOfYear = Math.floor((start.getTime() - startOfYear.getTime()) / DAY_MS);
    const nnn = String(dayOfYear).padStart(3, "0");
    return `PO-${y}-${nnn}`;
}

function formatDate(d: Date): string {
    return d.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function durationMinutes(start: Date, end: Date): number {
    return Math.round((end.getTime() - start.getTime()) / (60 * 1000));
}

function formatDuration(min: number): string {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `${h}h ${m}min` : `${h}h`;
}

function isWeekend(d: Date): boolean {
    const day = d.getDay();
    return day === 0 || day === 6;
}

/** Repeating 7-day period in px (one column per day) */
const WEEK_PX = 7 * COLUMN_WIDTH_PX;

const TICK_COLOR = "rgba(148, 163, 184, 0.5)";
const WEEKEND_BG = "rgba(255,255,255,0.06)";

/**
 * Build CSS background for day ticks + weekend strips.
 * Pattern repeats every 7 days (WEEK_PX). startDayOfWeek = first day of timeline getDay() (0=Sun, 6=Sat).
 * Returns { backgroundImage, backgroundSize } for inline style.
 */
function buildTimelineTickBackground(startDayOfWeek: number): { backgroundImage: string; backgroundSize: string } {
    const isWeekday = (i: number) => {
        const d = (startDayOfWeek + i) % 7;
        return d >= 1 && d <= 5;
    };
    // Weekend strip: per-day color over WEEK_PX (repeat at 84px = day 0 again)
    const stripStops: string[] = [];
    for (let i = 0; i <= 7; i++) {
        const pos = i * COLUMN_WIDTH_PX;
        const color = !isWeekday(i % 7) ? WEEKEND_BG : "transparent";
        stripStops.push(`${color} ${pos}px`);
    }
    const stripGradient = `linear-gradient(to right, ${stripStops.join(", ")})`;
    // Vertical ticks: 1px line at right edge of each weekday column
    const lineStops: string[] = ["transparent 0"];
    for (let i = 0; i < 7; i++) {
        if (isWeekday(i)) {
            const x = (i + 1) * COLUMN_WIDTH_PX;
            lineStops.push(`transparent ${x - 1}px`, `${TICK_COLOR} ${x}px`, `transparent ${x + 1}px`);
        }
    }
    lineStops.push(`transparent ${WEEK_PX}px`);
    const lineGradient = `linear-gradient(to right, ${lineStops.join(", ")})`;
    return {
        backgroundImage: `${stripGradient}, ${lineGradient}`,
        backgroundSize: `${WEEK_PX}px 100%, ${WEEK_PX}px 100%`,
    };
}

//------------------------------------------------------------------------------
/** Build list of days for the last 12 months (from 12 months ago to today), with isWeekend per day */
function buildDaySlots(): { date: Date; isWeekend: boolean }[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setMonth(start.getMonth() - MONTHS_TOTAL);
    start.setHours(0, 0, 0, 0);
    const slots: { date: Date; isWeekend: boolean }[] = [];
    const cursor = new Date(start);
    while (cursor.getTime() <= today.getTime()) {
        slots.push({ date: new Date(cursor), isWeekend: isWeekend(cursor) });
        cursor.setDate(cursor.getDate() + 1);
    }
    return slots;
}

/** Normalize to start-of-day for comparison */
function dayStart(d: Date): number {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
}

/** Place a stop into day indices relative to timeline start */
function stopToDayRange(
    stop: MachineStop,
    timelineStart: number,
    daysTotal: number,
): { startIndex: number; endIndex: number } | null {
    const start = dayStart(stop.startDate);
    const end = dayStart(stop.endDate);
    if (end < timelineStart) return null;
    const dayMs = DAY_MS;
    const startIndex = Math.max(0, Math.floor((start - timelineStart) / dayMs));
    const endIndex = Math.min(daysTotal - 1, Math.floor((end - timelineStart) / dayMs));
    if (startIndex > daysTotal - 1 || endIndex < 0) return null;
    return { startIndex, endIndex };
}

/** Day index for an order (start date) relative to timeline start; null if outside range */
function orderToDayIndex(order: Order, timelineStart: number, daysTotal: number): number | null {
    const start = dayStart(order.startDate);
    if (start < timelineStart) return null;
    const dayMs = DAY_MS;
    const index = Math.floor((start - timelineStart) / dayMs);
    if (index > daysTotal - 1 || index < 0) return null;
    return index;
}

/** First day index of each month in the timeline (for month labels) */
function buildMonthLabels(daySlots: { date: Date }[]): { dayIndex: number; label: string }[] {
    const out: { dayIndex: number; label: string }[] = [];
    daySlots.forEach((slot, i) => {
        if (slot.date.getDate() === 1) {
            out.push({ dayIndex: i, label: slot.date.toLocaleDateString(undefined, { month: "short" }) });
        }
    });
    return out;
}

//------------------------------------------------------------------------------
// Mock data: replace with real machine stops from context/API
const MOCK_STOPS: MachineStop[] = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return [
        {
            startDate: new Date(today.getTime() - 25 * DAY_MS),
            endDate: new Date(today.getTime() - 24 * DAY_MS),
            reason: "Maintenance",
        },
        {
            startDate: new Date(today.getTime() - 18 * DAY_MS),
            endDate: new Date(today.getTime() - 16 * DAY_MS),
            reason: "Breakdown",
        },
        {
            startDate: new Date(today.getTime() - 5 * DAY_MS),
            endDate: new Date(today.getTime() - 4 * DAY_MS),
            reason: "Quality check",
        },
    ];
})();

//------------------------------------------------------------------------------
export function FactoryTimeline({ stops = MOCK_STOPS, className }: { stops?: MachineStop[]; className?: string }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const daySlots = useMemo(() => buildDaySlots(), []);
    const timelineStart = useMemo(() => dayStart(daySlots[0]?.date ?? new Date()), [daySlots]);

    const daysTotal = daySlots.length;
    const trackWidth = daysTotal * COLUMN_WIDTH_PX;

    const stopRanges = useMemo(() => {
        return stops
            .map((stop) => {
                const range = stopToDayRange(stop, timelineStart, daysTotal);
                if (!range) return null;
                return { stop, ...range };
            })
            .filter((r): r is NonNullable<typeof r> => r !== null);
    }, [stops, timelineStart, daysTotal]);

    const monthLabels = useMemo(() => buildMonthLabels(daySlots), [daySlots]);
    const orderPositions = useMemo(() => {
        return orders
            .map((order) => {
                const dayIndex = orderToDayIndex(order, timelineStart, daysTotal);
                if (dayIndex == null) return null;
                return { order, dayIndex };
            })
            .filter((r): r is NonNullable<typeof r> => r !== null);
    }, [timelineStart, daysTotal]);

    const tickBackground = useMemo(() => {
        const startDay = daySlots[0]?.date.getDay() ?? 0;
        return buildTimelineTickBackground(startDay);
    }, [daySlots]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollLeft = el.scrollWidth - el.clientWidth;
    }, [trackWidth]);

    return (
        <aside
            className={cn(
                "pointer-events-auto border-t border-slate-200/20 pt-2 w-full bg-linear-to-b from-white/20 to-white/50 backdrop-blur-3xl",
                className,
            )}
        >
            {/* <p className="mb-2 text-xs font-medium text-slate-400"></p> */}
            <div ref={scrollRef} className="w-full overflow-x-auto overflow-y-hidden">
                <div className="relative flex min-w-max flex-col" style={{ width: trackWidth }}>
                    {/* Top row: month labels */}
                    <div className="absolute bottom-0 h-6 shrink-0 w-full" style={{ width: trackWidth }}>
                        {monthLabels.map(({ dayIndex, label }) => (
                            <span
                                key={`${dayIndex}-${label}`}
                                className="absolute top-0 text-[10px] font-medium text-slate whitespace-nowrap"
                                style={{ left: dayIndex * COLUMN_WIDTH_PX + 2 }}
                            >
                                {label}
                            </span>
                        ))}
                    </div>
                    {/* Row: order refs + Today */}
                    <div className="relative h-4 w-full shrink-0" style={{ width: trackWidth }}>
                        {orderPositions.map(({ order, dayIndex }) => (
                            <span
                                key={order.ref}
                                className="absolute top-0 text-2xs text-slate whitespace-nowrap truncate bg-slate-100 px-1 border border-slate-300 rounded-sm max-w-[80px]"
                                style={{ left: dayIndex * COLUMN_WIDTH_PX + 2 }}
                                title={order.ref}
                            >
                                {order.ref}
                            </span>
                        ))}
                        <span
                            className="absolute top-0 -translate-x-4 text-2xs font-semibold text-accent whitespace-nowrap"
                            style={{ left: (daysTotal - 1) * COLUMN_WIDTH_PX + 2 }}
                        >
                            Today
                        </span>
                    </div>
                    {/* Day ticks + bars area (min height so absolute bars fit) */}
                    <div className="relative min-h-9 w-full shrink-0" style={{ width: trackWidth }}>
                        <div
                            className="absolute bottom-0 inset-x-0 h-6 w-full bg-repeat-x"
                            style={{ ...tickBackground }}
                        />
                        {/* Last tick overlay (accent) – separate element so tick pattern stays unchanged */}
                        <div
                            className="absolute bottom-0 h-8 w-px"
                            style={{
                                left: trackWidth - 1,
                                backgroundColor: "var(--color-accent)",
                            }}
                        />
                        {/* Red bars for machine stopped */}
                        <div className="absolute bottom-0 h-full w-full" style={{ width: trackWidth }}>
                            {stopRanges.map(({ stop, startIndex, endIndex }, idx) => {
                                const ofNumber = ofNumberFromDates(stop.startDate, stop.endDate);
                                const duration = durationMinutes(stop.startDate, stop.endDate);
                                const left = startIndex * COLUMN_WIDTH_PX;
                                const width = (endIndex - startIndex + 1) * COLUMN_WIDTH_PX - 1;
                                return (
                                    <Tooltip
                                        key={idx}
                                        position="top"
                                        hoverable
                                        content={
                                            <div className="grid gap-1 text-left text-xs">
                                                <div className="font-semibold text-slate-100">{ofNumber}</div>
                                                <div>
                                                    <span className="text-slate-400">Start:</span>{" "}
                                                    {formatDate(stop.startDate)}
                                                </div>
                                                <div>
                                                    <span className="text-slate-400">End:</span>{" "}
                                                    {formatDate(stop.endDate)}
                                                </div>
                                                <div>
                                                    <span className="text-slate-400">Duration:</span>{" "}
                                                    {formatDuration(duration)}
                                                </div>
                                                {stop.reason && (
                                                    <div>
                                                        <span className="text-slate-400">Reason:</span> {stop.reason}
                                                    </div>
                                                )}
                                            </div>
                                        }
                                    >
                                        <div
                                            className="absolute bottom-0 h-full rounded-t-xs bg-warning-500/30 border-t-2 border-warning-500/80 hover:bg-warning-500/50 transition-all cursor-pointer"
                                            style={{
                                                left: left + 1,
                                                width: Math.max(width - 2, 4),
                                            }}
                                        />
                                    </Tooltip>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
