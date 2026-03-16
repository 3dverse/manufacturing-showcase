//------------------------------------------------------------------------------
import { BoundingBoxFaceProjection } from "@3dverse/livelink-react-ui";

//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { PanelLabel, PanelWrapper } from "@/components/common/panel";

//------------------------------------------------------------------------------
import type { MachineNode } from "@/content/type";

//------------------------------------------------------------------------------
const MOCK = {
    oee: 87,
    state: "In production",
    workOrderName: "OF-2024-0842",
    qualityRate: 98.2,
    quantityProduced: 1247,
};

//------------------------------------------------------------------------------
export function MachineInfoPanel({ machine }: { machine: MachineNode }) {
    return (
        <BoundingBoxFaceProjection
            entity={machine.entity}
            face="right"
            className="pointer-events-none flex items-center"
        >
            <ViewerPanel
                className="min-w-64 rounded-xl border-2 border-slate-0/50 shadow-lg [outline:2px_solid_#ffffff90] outline-offset-2"
                style={{ cornerShape: "bevel" } as React.CSSProperties}
            >
                <PanelWrapper className="py-3 px-4 space-y-3">
                    <p className="text-sm font-semibold text-slate-800 border-b border-slate-200/80 pb-2">
                        {machine.name}
                    </p>
                    <div className="grid gap-2 text-sm">
                        <div className="flex justify-between items-baseline gap-4">
                            <PanelLabel>Current OEE</PanelLabel>
                            <span className="font-semibold tabular-nums text-positive-700">{MOCK.oee}%</span>
                        </div>
                        <div className="flex justify-between items-baseline gap-4">
                            <PanelLabel>Current state</PanelLabel>
                            <span className="font-medium text-slate-800">{MOCK.state}</span>
                        </div>
                        <div className="flex justify-between items-baseline gap-4">
                            <PanelLabel>Current work order</PanelLabel>
                            <span className="font-medium text-slate-800 truncate max-w-32" title={MOCK.workOrderName}>
                                {MOCK.workOrderName}
                            </span>
                        </div>
                        <div className="flex justify-between items-baseline gap-4">
                            <PanelLabel>Current quality rate</PanelLabel>
                            <span className="font-semibold tabular-nums">{MOCK.qualityRate}%</span>
                        </div>
                        <div className="flex justify-between items-baseline gap-4">
                            <PanelLabel>Quantity produced</PanelLabel>
                            <span className="font-semibold tabular-nums">{MOCK.quantityProduced}</span>
                        </div>
                    </div>
                </PanelWrapper>
            </ViewerPanel>
        </BoundingBoxFaceProjection>
    );
}
