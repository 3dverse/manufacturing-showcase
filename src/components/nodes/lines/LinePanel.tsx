//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { PanelTitle, PanelWrapper } from "@/components/common/panel";

//------------------------------------------------------------------------------
import type { LineNode } from "@/content/type";

//------------------------------------------------------------------------------
export function LinePanel({ line }: { line: LineNode }) {
    return (
        <ViewerPanel as="article" className="w-full divide-y divide-slate-100 appear-in-from-left opacity-0">
            <PanelWrapper as="header" className="flex items-center justify-between py-2 pl-3 pr-4">
                <PanelTitle className="mb-0 text-sm text-default">{line.name} LINE</PanelTitle>
                <p className="text-right text-2xs leading-tight text-muted/80">No incidents reported</p>
            </PanelWrapper>
        </ViewerPanel>
    );
}
