//------------------------------------------------------------------------------
import { hoursFromNow } from "@/utils/helpers-time";

//------------------------------------------------------------------------------
export type MachineTimelineEvent = {
    id: string;
    type: "stop" | "maintenance";
    machine: string;
    details: string;
    date: Date;
    durationHours: number;
};

//------------------------------------------------------------------------------
export const machineTimelineEvents: MachineTimelineEvent[] = [
    {
        id: "stop-fanuc-power-reset",
        type: "stop",
        machine: "Fanuc M-950iA/500",
        details: "Unplanned stop due to power relay reset.",
        date: hoursFromNow(-110),
        durationHours: 2,
    },
    {
        id: "stop-omron-path-lock",
        type: "stop",
        machine: "Omron HD-1500",
        details: "Navigation lock detected on aisle crossing.",
        date: hoursFromNow(-92),
        durationHours: 3,
    },
    {
        id: "maintenance-fanuc-lubrication",
        type: "maintenance",
        machine: "Fanuc M-950iA/500",
        details: "Completed scheduled arm lubrication cycle.",
        date: hoursFromNow(-70),
        durationHours: 5,
    },
    {
        id: "stop-sekiguchi-overload",
        type: "stop",
        machine: "Sekiguchi SSD1000-DSF",
        details: "Press stopped on overload sensor alert.",
        date: hoursFromNow(-52),
        durationHours: 1.5,
    },
    {
        id: "maintenance-yantra-tool-check",
        type: "maintenance",
        machine: "Yantra Design CNC Drilling",
        details: "Tool alignment and spindle check completed.",
        date: hoursFromNow(-34),
        durationHours: 4,
    },
    {
        id: "stop-fanuc-safety-gate",
        type: "stop",
        machine: "Fanuc M-950iA/500",
        details: "Emergency gate open signal paused operation.",
        date: hoursFromNow(-18),
        durationHours: 2.5,
    },
    {
        id: "maintenance-omron-battery-calibration",
        type: "maintenance",
        machine: "Omron HD-1500",
        details: "Planned battery calibration and diagnostics.",
        date: hoursFromNow(58),
        durationHours: 6,
    },
];
