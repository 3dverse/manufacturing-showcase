//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { PanelTitle, PanelWrapper } from "@/components/common/panel";

//------------------------------------------------------------------------------
import type { AreaNode } from "@/content/type";

//------------------------------------------------------------------------------
export function GenericAreaPanel({ area }: { area: AreaNode }) {
    //--------------------------------------------------------------------------
    return (
        <ViewerPanel
            as="article"
            className="w-full h-fit divide-y divide-slate-100 pointer-events-auto appear-in-from-left opacity-0"
        >
            <PanelWrapper className="flex items-center justify-between py-2 px-3">
                <PanelTitle className="mb-0 text-sm text-default">{area.name} AREA</PanelTitle>
                <p className="bg-accent-100/30 px-1 py-px rounded-sm text-2xs text-muted/80">No incidents reported</p>
            </PanelWrapper>
        </ViewerPanel>
    );
}
