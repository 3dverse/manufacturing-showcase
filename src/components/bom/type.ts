//------------------------------------------------------------------------------
export type MESRoutingItem = {
    itemId: string;
    itemCode: string;
    itemDescription?: string;
};

//------------------------------------------------------------------------------
export type BOMFlowData = {
    itemId: string;
    itemType: BOMNodeData["itemType"];
    operationCode?: string;
    operationType?: string;
    workCenterOperationType?: string;
    workCenterId?: string;
    isSelected?: boolean;
    isHovered?: boolean;
};

//------------------------------------------------------------------------------
export type BOMNodeData = {
    itemId: string;
    itemType: "finished_good" | "wip" | "raw_material";
    producedBy?: {
        sequence: number;
        operationCode: string;
        operationType: "transformation" | "assembly" | "quality_control";
        workCenterOperationType: string;
        workCenterId: string;
        workCenterName: string;
    };
    children: BOMNodeData[];
};
