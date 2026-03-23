import { create } from "zustand";

//------------------------------------------------------------------------------
interface TimelineState {
    /** Current timeline position as a unix timestamp (seconds). */
    asOf: number;
    setAsOf: (t: number) => void;
}

//------------------------------------------------------------------------------
export const useTimelineStore = create<TimelineState>((set) => ({
    asOf: Math.floor(Date.now() / 1000),
    setAsOf: (t) => set({ asOf: t }),
}));
