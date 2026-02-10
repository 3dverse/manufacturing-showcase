import { faCalendarDays, faCheckCircle, faClockRotateLeft, faXmarkCircle } from "@fortawesome/pro-solid-svg-icons";

//------------------------------------------------------------------------------
export const orderStatus = {
    planned: { name: "Planned", color: "pr-1 text-neutral-700", icon: faCalendarDays },
    inProgress: {
        name: "In Progress",
        color: "pl-[6px] pr-1 py-px bg-accent text-accent-50 rounded-sm",
        icon: faClockRotateLeft,
    },
    completed: { name: "Completed", color: "pr-1 text-positive-700", icon: faCheckCircle },
    cancelled: { name: "Cancelled", color: "pr-1 text-negative", icon: faXmarkCircle },
};

//------------------------------------------------------------------------------
export const orders = [
    {
        ref: "123456",
        startDate: "Yes. 8:30",
        endDate: "Yes. 16:00",
        unitsPlanned: 134,
        unitsCompleted: 134,
        status: orderStatus.completed,
    },
    {
        ref: "123457",
        startDate: "Yes. 8:30",
        endDate: "Yes. 16:00",
        unitsPlanned: 143,
        unitsCompleted: 143,
        status: orderStatus.completed,
    },
    {
        ref: "123458",
        startDate: "Today 8:30",
        endDate: "Today 16:00",
        unitsPlanned: 152,
        unitsCompleted: 100,
        status: orderStatus.inProgress,
    },
    {
        ref: "123459",
        startDate: "Tom. 8:30",
        endDate: "Tom. 16:00",
        unitsPlanned: 161,
        unitsCompleted: 0,
        status: orderStatus.planned,
    },
    {
        ref: "123460",
        startDate: "30/01 8:30",
        endDate: "30/01 16:00",
        unitsPlanned: 170,
        unitsCompleted: 0,
        status: orderStatus.planned,
    },
    {
        ref: "123461",
        startDate: "31/01 8:30",
        endDate: "31/01 16:00",
        unitsPlanned: 179,
        unitsCompleted: 0,
        status: orderStatus.planned,
    },
];
