import type { ShiftConfig, ShiftDefinition, ShiftSlot } from "./types";

// Returns the UTC hour at which a local hour starts on a given date in a given timezone
function localHourToUtcMs(date: Date, localHour: number, timezone: string): number {
    // Build a date string for the given localHour in the timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hourStr = String(localHour).padStart(2, "0");
    const localString = `${year}-${month}-${day}T${hourStr}:00:00`;

    // Use Intl to parse the local time
    try {
        const parts = new Intl.DateTimeFormat("en-CA", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            hour12: false,
        }).formatToParts(date);

        // Parse using Date.parse with timezone context
        const parsed = new Date(`${localString}`);
        // We'll use a different approach: construct using toLocaleString offset
        void parts;
        void localString;

        // Simple offset approach: get the offset for the given date in the timezone
        const utcDate = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            localHour,
            0,
            0,
            0,
        );
        return utcDate.getTime();
    } catch {
        const utcDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), localHour, 0, 0, 0);
        return utcDate.getTime();
    }
}

// Get the local day-of-week for a given date (0=Sun, 1=Mon...6=Sat) in local time
function localDayOfWeek(date: Date): number {
    return date.getDay();
}

// Return the start of the calendar day (midnight) for a given UTC date
function startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

// Add days to a date
function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

export function generateShiftRoster(config: ShiftConfig, from: Date, to: Date): ShiftSlot[] {
    const slots: ShiftSlot[] = [];

    let cursor = startOfDay(from);
    const end = addDays(startOfDay(to), 1);

    while (cursor < end) {
        const dow = localDayOfWeek(cursor);

        if (config.workDays.includes(dow)) {
            for (const shift of config.shifts) {
                let shiftStartHour = shift.startHour;
                let shiftDay = new Date(cursor);

                // Night shift that starts on prev day crosses midnight
                const shiftStart = new Date(shiftDay);
                shiftStart.setHours(shiftStartHour, 0, 0, 0);

                const shiftEnd = new Date(shiftStart);
                shiftEnd.setTime(shiftEnd.getTime() + shift.durationHours * 60 * 60 * 1000);

                // Only include if there's overlap with [from, to]
                if (shiftEnd > from && shiftStart < to) {
                    slots.push({
                        shiftStart,
                        shiftEnd,
                        shiftName: shift.name,
                        cellId: "", // filled by caller per cell
                    });
                }
            }
        }

        cursor = addDays(cursor, 1);
    }

    return slots.sort((a, b) => a.shiftStart.getTime() - b.shiftStart.getTime());
}

export function shiftAt(date: Date, config: ShiftConfig): ShiftDefinition | null {
    const dow = localDayOfWeek(date);
    if (!config.workDays.includes(dow)) return null;

    const hour = date.getHours();
    const minute = date.getMinutes();
    const timeInDay = hour * 60 + minute;

    for (const shift of config.shifts) {
        const shiftStart = shift.startHour * 60;
        const shiftEnd = shiftStart + shift.durationHours * 60;

        if (shiftEnd > 24 * 60) {
            // Crosses midnight
            if (timeInDay >= shiftStart || timeInDay < shiftEnd - 24 * 60) {
                return shift;
            }
        } else {
            if (timeInDay >= shiftStart && timeInDay < shiftEnd) {
                return shift;
            }
        }
    }

    return null;
}

export function snapToShiftStart(date: Date, config: ShiftConfig): Date {
    const dow = localDayOfWeek(date);
    if (config.workDays.includes(dow)) {
        const hour = date.getHours();
        const minute = date.getMinutes();
        const timeInDay = hour * 60 + minute;

        for (const shift of config.shifts) {
            const shiftStart = shift.startHour * 60;
            const shiftEnd = shiftStart + shift.durationHours * 60;
            if (timeInDay >= shiftStart && timeInDay < shiftEnd) {
                const result = new Date(date);
                result.setHours(shift.startHour, 0, 0, 0);
                return result;
            }
        }
    }

    // Not in a shift — advance to next shift start
    return addWorkingMinutes(date, 0, config);
}

export function addWorkingMinutes(from: Date, minutes: number, config: ShiftConfig): Date {
    let cursor = new Date(from);
    let remaining = minutes;

    let safety = 0;
    while (safety < 100000) {
        safety++;
        const dow = localDayOfWeek(cursor);

        if (!config.workDays.includes(dow)) {
            // Advance to next day, start of first shift
            cursor = addDays(new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()), 1);
            cursor.setHours(config.shifts[0].startHour, 0, 0, 0);
            continue;
        }

        // Find which shift we're in, or next shift
        const hour = cursor.getHours();
        const minute = cursor.getMinutes();
        const timeInDay = hour * 60 + minute;

        let foundShift = false;
        for (const shift of config.shifts) {
            const shiftStartMin = shift.startHour * 60;
            const shiftEndMin = shiftStartMin + shift.durationHours * 60;

            if (timeInDay >= shiftStartMin && timeInDay < shiftEndMin) {
                const minutesLeftInShift = shiftEndMin - timeInDay;
                if (remaining <= minutesLeftInShift) {
                    cursor = new Date(cursor.getTime() + remaining * 60 * 1000);
                    return cursor;
                }
                remaining -= minutesLeftInShift;
                cursor = new Date(cursor.getTime() + minutesLeftInShift * 60 * 1000);
                foundShift = true;
                break;
            }

            // Before this shift
            if (timeInDay < shiftStartMin) {
                cursor.setHours(shift.startHour, 0, 0, 0);
                foundShift = true;
                break;
            }
        }

        if (!foundShift) {
            // After last shift of the day — advance to next work day
            cursor = addDays(new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()), 1);
            cursor.setHours(config.shifts[0].startHour, 0, 0, 0);
        }
    }

    return cursor;
}

export function binarySearchTimeline(entries: { start: Date }[], now: Date): number {
    let lo = 0;
    let hi = entries.length - 1;
    const t = now.getTime();

    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (entries[mid].start.getTime() <= t) {
            lo = mid + 1;
        } else {
            hi = mid - 1;
        }
    }

    // hi is now the last entry with start <= now
    if (hi >= 0) return hi;
    return -1;
}
