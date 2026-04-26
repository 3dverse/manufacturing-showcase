export type ShiftDefinition = {
    name: string;
    start: string; // "HH:MM" 24-hour
    end: string; // "HH:MM" 24-hour
};

// Mirrors the generator defaults in server/sources/generator/config.ts
export const FACTORY_SHIFTS: ShiftDefinition[] = [
    { name: "First", start: "06:00", end: "14:00" },
    { name: "Second", start: "14:00", end: "22:00" },
];

// 0 = Sun … 6 = Sat — matches the generator workDays default
export const FACTORY_WORK_DAYS: number[] = [1, 2, 3, 4, 5];

//------------------------------------------------------------------------------

function parseHHMM(hhmm: string): { h: number; m: number } {
    const [h, m] = hhmm.split(":").map(Number);
    return { h, m };
}

/**
 * Returns all closed (non-working) intervals within [winStart, winEnd] as
 * unix second pairs. Includes nighttime gaps between/around shifts on work
 * days and full-day closures on non-work days.
 */
export function buildClosedIntervals(
    winStart: number,
    winEnd: number,
    shifts: ShiftDefinition[] = FACTORY_SHIFTS,
    workDays: number[] = FACTORY_WORK_DAYS,
): { start: number; end: number }[] {
    const closed: { start: number; end: number }[] = [];

    const cur = new Date(winStart * 1000);
    cur.setHours(0, 0, 0, 0);

    while (cur.getTime() / 1000 < winEnd) {
        const dayStart = cur.getTime() / 1000;
        const dayEnd = dayStart + 86400;

        if (!workDays.includes(cur.getDay())) {
            closed.push({ start: dayStart, end: dayEnd });
        } else {
            const openIntervals = shifts
                .map((s) => {
                    const { h: sh, m: sm } = parseHHMM(s.start);
                    const { h: eh, m: em } = parseHHMM(s.end);
                    const start = new Date(cur);
                    start.setHours(sh, sm, 0, 0);
                    const end = new Date(cur);
                    end.setHours(eh, em, 0, 0);
                    return { start: start.getTime() / 1000, end: end.getTime() / 1000 };
                })
                .sort((a, b) => a.start - b.start);

            let prev = dayStart;
            for (const open of openIntervals) {
                if (open.start > prev) closed.push({ start: prev, end: open.start });
                prev = open.end;
            }
            if (prev < dayEnd) closed.push({ start: prev, end: dayEnd });
        }

        cur.setDate(cur.getDate() + 1);
    }

    // Clip to the requested window
    return closed
        .map(({ start, end }) => ({ start: Math.max(start, winStart), end: Math.min(end, winEnd) }))
        .filter(({ start, end }) => start < end);
}
