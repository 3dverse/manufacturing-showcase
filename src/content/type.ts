import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { StationId } from "./stations/enum";

//------------------------------------------------------------------------------
export type Station = {
    id: StationId;
    name: string;
    description?: string;
    technical_documentations?: string[];
    technical_plans?: string[];
    modules?: Module[];
};

//------------------------------------------------------------------------------
export type Module = {
    id: string;
    name: string;
    description?: string;
    image?: string;
    technical_documentations?: string[];
    technical_plans?: string[];
    states?: ModuleState[];
    pieces?: Piece[];
};

//------------------------------------------------------------------------------
export type Piece = {
    id: string;
    name: string;
    description?: string;
    type: "motor" | "sensor" | "actuator" | "other";
    technical_documentations?: string[];
    technical_plans?: string[];
    states?: MotorState[];
};

//------------------------------------------------------------------------------
export type ModuleState = {
    timestamp: number;
    active: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: StateValue | string | number | boolean | any;
};

//------------------------------------------------------------------------------
export type MotorState = {
    timestamp: number;
    active?: boolean;
    resetInitial?: boolean;
    temperature?: StateValue;
    intensity?: StateValue;
    power?: StateValue;
    coupling?: string;
    course?: number; // mm
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: StateValue | string | number | boolean | any;
};

//------------------------------------------------------------------------------
export type StateValue = {
    value: number;
    unit?: string;
    warning_threshold?: number;
    critical_threshold?: number;
};

//------------------------------------------------------------------------------
export type OrderStatus = {
    name: string;
    color: string;
    icon: IconDefinition;
};

//------------------------------------------------------------------------------
export type Order = {
    ref: string;
    description?: string;
    status: OrderStatus;
    startDate: string;
    endDate: string;
    unitsPlanned: number;
    unitsCompleted: number;
};

//------------------------------------------------------------------------------
export type UseCase = {
    id: string;
    name: string;
    description: string;
    steps: UseCaseStep[];
};

//------------------------------------------------------------------------------
export type UseCaseStep = {
    id: string;
    name: string;
    description: string;
    delayBefore: number; // ms
    incidents: UseCaseIncident[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
};

//------------------------------------------------------------------------------
export type UseCaseIncident = {
    type: "warning" | "error";
    description: string;
    machines: Machine[];
    possibleCauses: string[];
    consequences: string[];
    actions: Action[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
};

//------------------------------------------------------------------------------
export type Machine = {
    station: StationId;
    machines: string[];
};

//------------------------------------------------------------------------------
export type Action = {
    id: string;
};
