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
        ref: "SO 000020",
        client: "Client A Inc.",
        startDate: new Date("2026-04-16T08:30:00"),
        endDate: new Date("2026-04-18T10:00:00"),
        unitsPlanned: 1034,
        unitsCompleted: 1034,
        status: orderStatus.completed,
    },
    {
        ref: "SO 000021",
        client: "Client A Inc.",
        startDate: new Date("2026-04-18T12:30:00"),
        endDate: new Date("2026-04-19T18:30:00"),
        unitsPlanned: 143,
        unitsCompleted: 143,
        status: orderStatus.completed,
    },
    {
        ref: "SO 000022",
        client: "Client A Inc.",
        startDate: new Date("2026-04-19T10:30:00"),
        endDate: new Date("2026-04-21T16:00:00"),
        unitsPlanned: 152,
        unitsCompleted: 100,
        status: orderStatus.inProgress,
    },
    {
        ref: "SO 000023",
        client: "Client B Inc.",
        startDate: new Date("2026-04-21T08:30:00"),
        endDate: new Date("2026-04-22T16:00:00"),
        unitsPlanned: 161,
        unitsCompleted: 0,
        status: orderStatus.planned,
    },
    {
        ref: "SO 000024",
        client: "Client B Inc.",
        startDate: new Date("2026-04-23T10:30:00"),
        endDate: new Date("2026-04-25T16:00:00"),
        unitsPlanned: 170,
        unitsCompleted: 0,
        status: orderStatus.planned,
    },
    {
        ref: "SO 000025",
        client: "Client A Inc.",
        startDate: new Date("2026-04-23T08:30:00"),
        endDate: new Date("2026-04-24T16:00:00"),
        unitsPlanned: 179,
        unitsCompleted: 0,
        status: orderStatus.planned,
    },
];
