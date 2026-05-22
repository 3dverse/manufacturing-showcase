//------------------------------------------------------------------------------
import { FaCalendarAlt, FaCheckCircle, FaHistory, FaTimesCircle } from "react-icons/fa";

//------------------------------------------------------------------------------
import type { Order } from "@/content/type";

//------------------------------------------------------------------------------
import { hoursFromNow } from "@/utils/helpers-time";

//------------------------------------------------------------------------------
export const orderStatus = {
    planned: { name: "Planned", color: "text-neutral-700", icon: FaCalendarAlt },
    inProgress: {
        name: "In Progress",
        color: "text-accent",
        icon: FaHistory,
    },
    completed: { name: "Completed", color: "text-positive-700", icon: FaCheckCircle },
    cancelled: { name: "Cancelled", color: "text-negative", icon: FaTimesCircle },
};

//------------------------------------------------------------------------------
export const orders: Order[] = [
    {
        ref: "MO 000020",
        client: "Client A Inc.",
        startDate: hoursFromNow(-120),
        endDate: hoursFromNow(-72),
        unitsPlanned: 1034,
        unitsCompleted: 1034,
        status: orderStatus.completed,
        details: {
            delivery: "Delivered to Dock 03, ASN confirmed by WMS, carrier pickup closed 12 min early.",
            machine: "Line A / Robot cell 02 completed the batch with 99.8% cycle adherence.",
            incident: "No open incident. Last quality deviation was auto-cleared after vision recalibration.",
            digitalTwin: "Twin replay shows stable takt time at 42 sec/unit and no blocked buffers.",
            action: "Archive production trace and keep the quality certificate available for Client A.",
        },
    },
    {
        ref: "MO 000021",
        client: "Client A Inc.",
        startDate: hoursFromNow(-68),
        endDate: hoursFromNow(-22),
        unitsPlanned: 143,
        unitsCompleted: 143,
        status: orderStatus.completed,
        description: "Delayed 35 min - incident on Machine X, Line Y",
        estimatedDelayInMin: 35,
        details: {
            delivery: "Shipped with a 35 min delay. Final delivery slot kept after dock priority escalation.",
            machine: "Machine X / Line Y reported torque peaks during the last 18 production cycles.",
            incident: "Incident detected on Machine X: spindle vibration exceeded warning threshold at 8.4 mm/s.",
            digitalTwin: "Digital twin flags a recurring heat pattern near bearing housing B after long runs.",
            action: "Maintenance ticket MT-447 queued; inspect spindle coupling before the next Client A batch.",
        },
    },
    {
        ref: "MO 000022",
        client: "Client A Inc.",
        startDate: hoursFromNow(-8),
        endDate: hoursFromNow(30),
        unitsPlanned: 152,
        unitsCompleted: 100,
        status: orderStatus.inProgress,
        details: {
            delivery: "ETA remains on time for Dock 02. 52 units left before packaging release.",
            machine: "Machine X / Line Y is running at 92% nominal speed after predictive cooling adjustment.",
            incident: "Minor feeder desync risk detected; no stop required while buffer stays above 24 units.",
            digitalTwin: "Twin projection predicts completion 18 min before promised ship time if takt holds.",
            action: "Monitor feeder vibration and keep AGV route R-12 reserved for finished goods transfer.",
        },
    },
    {
        ref: "MO 000023",
        client: "Client B Inc.",
        startDate: hoursFromNow(20),
        endDate: hoursFromNow(52),
        unitsPlanned: 161,
        unitsCompleted: 0,
        status: orderStatus.planned,
        description: "Storage OK - ready for production",
        details: {
            delivery: "Material staged in storage rack S-14. Planned delivery window opens tomorrow at 09:30.",
            machine: "Assigned to Line B / Assembly cell 04, currently idle and available.",
            incident: "No active incident. Pre-start checklist passed for tooling, safety gate, and calibration.",
            digitalTwin: "Simulation reserves 32 min setup time and forecasts 96% OEE for the first shift.",
            action: "Confirm operator allocation and lock the first AGV movement 20 min before start.",
        },
    },
    {
        ref: "MO 000024",
        client: "Client B Inc.",
        startDate: hoursFromNow(56),
        endDate: hoursFromNow(104),
        unitsPlanned: 170,
        unitsCompleted: 0,
        status: orderStatus.planned,
        description: "Waiting for Material X - delivery planned in WMS",
        details: {
            delivery: "Material X inbound to Dock 01; WMS confirms supplier ETA in 6 hr 20 min.",
            machine: "Machine Z / Line C reserved, but setup cannot start until Material X is scanned in.",
            incident: "Supply risk: one pallet is still in transit and may compress the preparation window.",
            digitalTwin: "Twin scenario shows a 22 min schedule slip if the pallet arrives after 17:00.",
            action: "Keep an alternate slot on Line B available and alert logistics if ETA drifts by 15 min.",
        },
    },
    {
        ref: "MO 000025",
        client: "Client A Inc.",
        startDate: hoursFromNow(50),
        endDate: hoursFromNow(82),
        unitsPlanned: 179,
        unitsCompleted: 0,
        status: orderStatus.planned,
        details: {
            delivery: "Planned for express shipment after the morning production wave.",
            machine: "Line A / Robot cell 01 reserved after toolhead changeover.",
            incident: "No incident. Energy load forecast is high during the planned start window.",
            digitalTwin: "Twin recommends starting 12 min earlier to avoid overlap with cleaning downtime.",
            action: "Validate toolhead availability and confirm final dispatch priority with Client A.",
        },
    },
];
