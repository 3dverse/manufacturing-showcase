//------------------------------------------------------------------------------
import { faCalendarDays, faCheckCircle, faClockRotateLeft, faXmarkCircle } from "@fortawesome/pro-light-svg-icons";

//------------------------------------------------------------------------------
import type { Order } from "@/content/type";

//------------------------------------------------------------------------------
import { hoursFromNow } from "@/utils/helpers-time";

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
        startDate: hoursFromNow(-120),
        endDate: hoursFromNow(-72),
        unitsPlanned: 1034,
        unitsCompleted: 1034,
        status: orderStatus.completed,
    },
    {
        ref: "SO 000021",
        client: "Client A Inc.",
        startDate: hoursFromNow(-68),
        endDate: hoursFromNow(-22),
        unitsPlanned: 143,
        unitsCompleted: 143,
        status: orderStatus.completed,
    },
    {
        ref: "SO 000022",
        client: "Client A Inc.",
        startDate: hoursFromNow(-8),
        endDate: hoursFromNow(30),
        unitsPlanned: 152,
        unitsCompleted: 100,
        status: orderStatus.inProgress,
    },
    {
        ref: "SO 000023",
        client: "Client B Inc.",
        startDate: hoursFromNow(20),
        endDate: hoursFromNow(52),
        unitsPlanned: 161,
        unitsCompleted: 0,
        status: orderStatus.planned,
    },
    {
        ref: "SO 000024",
        client: "Client B Inc.",
        startDate: hoursFromNow(56),
        endDate: hoursFromNow(104),
        unitsPlanned: 170,
        unitsCompleted: 0,
        status: orderStatus.planned,
    },
    {
        ref: "SO 000025",
        client: "Client A Inc.",
        startDate: hoursFromNow(50),
        endDate: hoursFromNow(82),
        unitsPlanned: 179,
        unitsCompleted: 0,
        status: orderStatus.planned,
    },
];
