//------------------------------------------------------------------------------
import { useContext, useMemo, useState } from "react";
import { BoundingBoxFaceProjection } from "@3dverse/livelink-react-ui";
import { faChartLine, faCheckToSlot, faFilePdf } from "@fortawesome/sharp-regular-svg-icons";
import { faExclamationTriangle } from "@fortawesome/sharp-solid-svg-icons";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";
import Button from "@/components/common/Button";
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { PanelTitle, PanelWrapper } from "@/components/common/panel";
import { DataContainer, DataLabel, DataValue } from "@/components/common/panel/DataLabel";
import { Triangle } from "@/components/common/icons/Triangle";

//------------------------------------------------------------------------------
import type { MachineNode } from "@/content/type";
import { getMachineDocumentation } from "@/content/machine";

//------------------------------------------------------------------------------
import { useProjection } from "@/hooks/useProjection";
import { useScope } from "@/hooks/useScope";
import { useSnapshot } from "@/hooks/useSnapshot";
import { useTimelineStore } from "@/store/useTimelineStore";
import { downtimeAtAsOf } from "@/components/timeline/timeUtils";
import { SelectionContext } from "@/contexts/SelectionContext";

//------------------------------------------------------------------------------
const MOCK = {
    oee: 87,
};
const URL = "https://explorer-test.productys.com/?zoom_level=20&dashboard_id=168";

//------------------------------------------------------------------------------
export function MachineInfoPanel({ machine }: { machine: MachineNode }) {
    //--------------------------------------------------------------------------
    const [isMESDashboardVisible, setIsMESDashboardVisible] = useState(false);

    //--------------------------------------------------------------------------
    const { selectedNode } = useContext(SelectionContext);
    const { scope } = useScope(selectedNode ?? null);
    const { snapshot } = useSnapshot(scope);
    const projection = useProjection(snapshot);
    const order = projection?.productionOrders[0] ?? null;

    //--------------------------------------------------------------------------
    const span = useTimelineStore((s) => s.span);
    const asOf = useTimelineStore((s) => s.asOf);

    const hasIncident = useMemo(() => {
        if (!span) return false;
        const cellHash = machine.parent.hash;
        return [...span.downtimeEvents.values()].some((e) => e.workCenterId === cellHash && downtimeAtAsOf(e, asOf));
    }, [span, asOf, machine.parent.hash]);

    //--------------------------------------------------------------------------
    const { orderNumber, itemCode } = order ?? { orderNumber: "", itemCode: "" };
    const { goodQuantity = 0, scrapQuantity = 0 } = order?.quantities ?? {};
    const machineDetails = getMachineDocumentation(machine.name);

    const quality =
        goodQuantity + scrapQuantity > 0
            ? Number((goodQuantity / (goodQuantity + scrapQuantity)) * 100).toFixed(0)
            : undefined;

    //--------------------------------------------------------------------------
    if (!order) return null;
    return (
        <BoundingBoxFaceProjection
            entity={machine.entity}
            face="right"
            className="flex flex-col justify-end gap-3 transform-3d pointer-events-none"
        >
            {hasIncident && (
                <>
                    {/* <div className="absolute top-0 left-0 w-80 h-24 translate-x-[80%] bg-warning-500/50 [transform:translateZ(.5px)] blur-sm" /> */}
                    <ViewerPanel className="transform-[translateZ(-.1px)] relative min-w-80 bg-warning-500 shadow-[0_-4px_56px_-1px_var(--color-warning-500)] [corner-shape:bevel] starting:opacity-0 starting:translate-y-8 opacity-100 translate-y-0 translate-x-[80%] transition-all duration-400 delay-500">
                        <PanelWrapper className="py-2">
                            <PanelTitle className="capitalize text-warning-100 text-sm">
                                <Icon icon={faExclamationTriangle} className="mr-2 text-sm text-warning-100" />
                                Incident reported
                            </PanelTitle>
                            <Button
                                size="sm"
                                variant="outline"
                                className="mt-2 w-full border-warning-400 text-warning-100 hover:bg-warning-400 hover:text-warning-100"
                            >
                                <Icon icon={faFilePdf} className="mr-2 text-sm text-warning-100" />
                                Read the report
                            </Button>
                        </PanelWrapper>
                    </ViewerPanel>
                </>
            )}
            <ViewerPanel className="min-w-80 rounded-xl border-2 border-slate-0/50 shadow-lg [corner-shape:bevel] [outline:2px_solid_#ffffff90] outline-offset-2 translate-x-[80%] starting:translate-x-[60%] transition-transform duration-400">
                <PanelWrapper className="py-3 px-2 space-y-3">
                    <p className="px-2 capitalize text-sm font-semibold text-slate-800 border-b border-slate-200/80 pb-2">
                        {machineDetails.name}
                    </p>

                    <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-2">
                            <DataContainer className="gap-0 justify-between bg-positive-500/10">
                                <DataLabel>
                                    Current OEE
                                    <Triangle className="w-3 ml-2" />
                                </DataLabel>
                                <DataValue className="text-4xl text-positive-700">
                                    {MOCK.oee}
                                    <span className="inline-block ml-1 text-xl -translate-y-3 opacity-80">%</span>
                                </DataValue>
                            </DataContainer>
                            <DataContainer className="gap-0 justify-between">
                                <DataLabel className="flex items-center gap-2 text-positive-700 ">
                                    <Icon icon={faCheckToSlot} />
                                    In production
                                </DataLabel>
                                <DataValue className="mt-1 text-slate-800">{orderNumber}</DataValue>
                                <p className="text-xs text-accent-500">{itemCode}</p>
                            </DataContainer>
                        </div>
                        <div className="grid grid-cols-[1fr_2fr] gap-2">
                            <DataContainer>
                                <DataLabel>Quality</DataLabel>
                                <DataValue className="text-2xl text-slate-800">
                                    {quality ? (
                                        <>
                                            {quality}
                                            <span className="inline-block ml-1 text-sm -translate-y-2 opacity-80">
                                                %
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-slate-300 font-light">N/A</span>
                                    )}
                                </DataValue>
                            </DataContainer>
                            <div className="grid grid-cols-2">
                                <DataContainer className="rounded-e-none">
                                    <DataLabel className="text-positive-800">Valid</DataLabel>
                                    <DataValue className="text-2xl text-positive-800">{goodQuantity}</DataValue>
                                </DataContainer>
                                <DataContainer className="rounded-s-none -ml-px">
                                    <DataLabel className="text-negative-800">Rejected</DataLabel>
                                    <DataValue className="text-2xl text-negative-800">{scrapQuantity}</DataValue>
                                </DataContainer>
                            </div>
                        </div>
                        <Button
                            size="2xs"
                            variant="ghost"
                            className="flex w-fit justify-start gap-2"
                            onClick={() => setIsMESDashboardVisible(!isMESDashboardVisible)}
                        >
                            <Icon icon={faChartLine} />
                            MES Dashboard
                        </Button>
                    </div>
                </PanelWrapper>
            </ViewerPanel>
            {isMESDashboardVisible && (
                <div className="absolute top-1/2 left-1/2 z-10 w-90 h-full starting:opacity-0 starting:-translate-x-[80%] opacity-100 -translate-y-1/2 -translate-x-full transition-all duration-300 hover:scale-105 hover:-translate-z-[.25px]">
                    <iframe src={URL} className="w-full h-full" />
                </div>
            )}
        </BoundingBoxFaceProjection>
    );
}
