export interface OperationTemplate {
    operationCode: string;
    operationDescription: string;
    setupMinutes: number;
    cycleMinutesPerItem: number;
    defects: string[];
}

export const ALL_OP_TYPES = ["MACHINING", "ASSEMBLY", "PAINTING", "QUALITY_CONTROL"] as const;

export const OPERATION_TEMPLATES: Record<string, OperationTemplate> = {
    MACHINING: {
        operationCode: "MCH-10",
        operationDescription: "CNC Machining",
        setupMinutes: 30,
        cycleMinutesPerItem: 3.5,
        defects: ["DIMENSIONAL_OOT", "SURFACE_FINISH", "TOOL_MARK", "BROKEN_PART"],
    },
    ASSEMBLY: {
        operationCode: "ASM-20",
        operationDescription: "Assembly",
        setupMinutes: 15,
        cycleMinutesPerItem: 2.5,
        defects: ["MISSING_COMPONENT", "TORQUE_OOT", "COSMETIC_DAMAGE", "ASSEMBLY_ERROR"],
    },
    PAINTING: {
        operationCode: "PNT-15",
        operationDescription: "Painting",
        setupMinutes: 20,
        cycleMinutesPerItem: 1.0,
        defects: ["COATING_THIN", "PAINT_ADHESION", "SURFACE_CONTAMINATION"],
    },
    QUALITY_CONTROL: {
        operationCode: "QC-40",
        operationDescription: "Quality Inspection",
        setupMinutes: 10,
        cycleMinutesPerItem: 0.75,
        defects: ["DIMENSIONAL_OOT", "FUNCTIONAL_FAILURE", "COSMETIC_DAMAGE", "DOCUMENTATION_ERROR"],
    },
};

export const DEFAULT_OPERATION_TEMPLATE: OperationTemplate = {
    operationCode: "GEN-10",
    operationDescription: "General Processing",
    setupMinutes: 15,
    cycleMinutesPerItem: 2.0,
    defects: ["DEFECT"],
};
