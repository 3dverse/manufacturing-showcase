import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { StationId } from "./stations/enum";
import type { Entity } from "@3dverse/livelink";
import type { NodeTypes } from "./enums";

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
    client: string;
    description?: string;
    status: OrderStatus;
    startDate: Date;
    endDate: Date;
    unitsPlanned: number;
    unitsCompleted: number;
};

//------------------------------------------------------------------------------
export type UseCase = {
    id: string;
    name: string;
    description: string;
    image?: string;
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

//------------------------------------------------------------------------------
type _FactoryGraphNode = {
    entity: Entity;
    euid: string;
    name: string;
};
export type FactoryNode = _FactoryGraphNode & { type: NodeTypes.factory; areas: AreaNode[] };
/** One 3D point [x, y, z] on a flow spline. */
export type FlowSplinePoint = [number, number, number];

export type FlowPair = {
    in: FlowInNode;
    out: FlowOutNode;
    /** Optional 3D spline points for curved flow path. */
    spline?: FlowSplinePoint[];
};

export type AreaFlows = {
    ins: FlowInNode[];
    outs: FlowOutNode[];
    /** Pairs of in/out with matching names across different areas (in from this area, out from another). */
    pairs: FlowPair[];
};

export type AreaNode = _FactoryGraphNode & {
    type: NodeTypes.area;
    parent: FactoryNode;
    lines: LineNode[];
    cells: CellNode[];
    flows: AreaFlows;
};

export type LineNode = _FactoryGraphNode & { type: NodeTypes.line; parent: AreaNode; cells: CellNode[] };

export type CellNode = _FactoryGraphNode & {
    type: NodeTypes.cell;
    parent: AreaNode | CellNode;
    machines: MachineNode[];
};
export type MachineNode = _FactoryGraphNode & { type: NodeTypes.machine; parent: CellNode };
export type FlowInNode = _FactoryGraphNode & { type: NodeTypes.flowIn; parent: AreaNode };
export type FlowOutNode = _FactoryGraphNode & { type: NodeTypes.flowOut; parent: AreaNode };

export type FactoryGraphNode = FactoryNode | AreaNode | LineNode | CellNode | MachineNode | FlowInNode | FlowOutNode;
