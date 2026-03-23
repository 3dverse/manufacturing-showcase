import { faCalendarDays, faCheckCircle, faClockRotateLeft, faXmarkCircle } from "@fortawesome/pro-light-svg-icons";
import type { Order } from "@/content/type";

//------------------------------------------------------------------------------
export const orderStatus = {
    planned: { name: "Planned", color: "text-neutral-700", icon: faCalendarDays },
    inProgress: {
        name: "In Progress",
        color: "text-accent",
        icon: faClockRotateLeft,
    },
    completed: { name: "Completed", color: "text-positive-700", icon: faCheckCircle },
    cancelled: { name: "Cancelled", color: "text-negative", icon: faXmarkCircle },
};

//------------------------------------------------------------------------------
export const orders: Order[] = [
    {
        ref: "PO 123456",
        client: "ABC Inc.",
        startDate: new Date("2026-02-27T08:30:00"),
        endDate: new Date("2026-02-27T16:00:00"),
        unitsPlanned: 134,
        unitsCompleted: 134,
        status: orderStatus.completed,
    },
    {
        ref: "PO 123457",
        client: "ABC Inc.",
        startDate: new Date("2026-02-27T08:30:00"),
        endDate: new Date("2026-02-27T16:00:00"),
        unitsPlanned: 143,
        unitsCompleted: 143,
        status: orderStatus.completed,
    },
    {
        ref: "PO 123458",
        client: "ABC Inc.",
        startDate: new Date("2026-02-27T08:30:00"),
        endDate: new Date("2026-02-27T16:00:00"),
        unitsPlanned: 152,
        unitsCompleted: 100,
        status: orderStatus.inProgress,
    },
    {
        ref: "PO 123459",
        client: "ABC Inc.",
        startDate: new Date("2026-02-28T08:30:00"),
        endDate: new Date("2026-02-28T16:00:00"),
        unitsPlanned: 161,
        unitsCompleted: 0,
        status: orderStatus.planned,
    },
    {
        ref: "PO 123460",
        client: "ABC Inc.",
        startDate: new Date("2026-01-30T08:30:00"),
        endDate: new Date("2026-01-30T16:00:00"),
        unitsPlanned: 170,
        unitsCompleted: 0,
        status: orderStatus.planned,
    },
    {
        ref: "PO 123461",
        client: "ABC Inc.",
        startDate: new Date("2026-01-31T08:30:00"),
        endDate: new Date("2026-01-31T16:00:00"),
        unitsPlanned: 179,
        unitsCompleted: 0,
        status: orderStatus.planned,
    },
];
