import type { Client, Entity, Vec3 } from "@3dverse/livelink";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { StationId } from "./stations/enum";
import type { NodeTypes } from "./enums";
import type { ScenarioIncidentAction } from "./scenarios/scenarios";

//------------------------------------------------------------------------------
export type Avatar = {
    client: Client;
    name: string;
    initials: string;
    color: string;
    textColor: string;
};

//------------------------------------------------------------------------------
export type Factory = {
    video: string | undefined;
    name: string;
    slug: string;
    location: string;
    description?: string;
    scene_id: string;
    enabled: boolean;
};

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
export type OrderDetails = {
    delivery: string;
    machine: string;
    incident: string;
    digitalTwin: string;
    action: string;
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
    estimatedDelayInMin?: number;
    details?: OrderDetails;
};

//------------------------------------------------------------------------------
export type Scenario = {
    id: string;
    name: string;
    description: string;
    image?: string;
    steps: ScenarioStep[];
};

//------------------------------------------------------------------------------
export type ScenarioStep = {
    id: string;
    title: string;
    description: React.ReactNode | string;
    route: string;
    selector: string;
    incident?: ScenarioIncident;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
};

//------------------------------------------------------------------------------
export type ScenarioIncident = {
    message: string;
    actions: ScenarioIncidentAction[];
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
type _SceneGraphNode = {
    entity: Entity;
    hash: string;
    name: string;
    id: string | undefined;
};
export type FactoryNode = _SceneGraphNode & { type: NodeTypes.factory; areas: AreaNode[]; flows: FlowNode[] };
/** One 3D point [x, y, z] on a flow spline. */
export type FlowSplinePoint = [number, number, number];

export type AreaNode = _SceneGraphNode & {
    type: NodeTypes.area;
    parent: FactoryNode;
    lines: LineNode[];
    cells: CellNode[];
    aisles: AisleNode[];
    racks: RackNode[];
};

export type LineNode = _SceneGraphNode & { type: NodeTypes.line; parent: AreaNode; cells: CellNode[] };

export type CellNode = _SceneGraphNode & {
    type: NodeTypes.cell;
    parent: AreaNode | LineNode;
    machines: MachineNode[];
    outputs: OutNode[];
};

export type OutNode = _SceneGraphNode & { type: NodeTypes.out; parent: CellNode };

export type MachineNode = _SceneGraphNode & { type: NodeTypes.machine; parent: CellNode };

export type AisleNode = _SceneGraphNode & { type: NodeTypes.aisle; parent: AreaNode; racks: RackNode[] };

export type RackNode = _SceneGraphNode & {
    type: NodeTypes.rack;
    parent: AreaNode | AisleNode;
    bins: BinNode[];
};
export type BinNode = _SceneGraphNode & { type: NodeTypes.bin; parent: RackNode };

export type FlowNode = _SceneGraphNode & {
    type: NodeTypes.flow;
    entityInEUID: string;
    entityOutEUID: string;
    machines: Entity[];
    paths: Vec3[];
};

//------------------------------------------------------------------------------
export type SceneGraphNode =
    | FactoryNode
    | AreaNode
    | LineNode
    | CellNode
    | MachineNode
    | AisleNode
    | RackNode
    | BinNode;

//------------------------------------------------------------------------------
// TODO delete VVV
export type Point = { x: number; y: number };
export type QuadPoint = [Point, Point, Point, Point];
export type QuadData = {
    quad: QuadPoint;
    dimensions: { width: number; height: number };
};
export type Quad = [Vec3, Vec3, Vec3, Vec3]; // tl, tr, br, bl

//------------------------------------------------------------------------------
export type ElementType = "factory" | "area" | "line" | "cell" | "machine";
export type AreaCategory = "Reception" | "Production" | "Storage" | "Control";
export type Element = { type: ElementType; id: string; count: string; entity: Entity; category?: AreaCategory };
