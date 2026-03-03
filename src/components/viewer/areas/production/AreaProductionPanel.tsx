//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { PanelTitle, PanelWrapper } from "@/components/common/panel";

//------------------------------------------------------------------------------
import type { AreaNode } from "@/content/type";

//------------------------------------------------------------------------------
export function AreaProductionPanel({ area }: { area: AreaNode }) {
    //--------------------------------------------------------------------------
    return (
        <ViewerPanel
            as="article"
            className="absolute right-2 bottom-10 w-96 2xl:w-120 h-fit pb-24 divide-y divide-slate-100 pointer-events-auto appear-in-from-right opacity-0 [--animation-delay:.75s]"
        >
            <PanelWrapper className="flex items-center justify-between py-2 pl-3 pr-4">
                <PanelTitle className="mb-0 text-sm text-default">{area.name} AREA</PanelTitle>
                <p className="bg-accent-100/30 px-1 py-px rounded-sm text-2xs text-muted/80">No incidents reported</p>
            </PanelWrapper>

            <article className="px-2 mb-3 py-3">Todo</article>
        </ViewerPanel>
    );
}
