//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { PanelLabel, PanelTitle, PanelWrapper } from "@/components/common/panel";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { MachineNode } from "@/content/type";

//------------------------------------------------------------------------------
export function MachinePanel({
    machine,
    className,
    style,
}: {
    machine: MachineNode;
    className?: string;
    style?: React.CSSProperties;
}) {
    return (
        <ViewerPanel as="article" className={className} style={style}>
            <PanelWrapper as="header" className="flex items-center justify-between py-2 pl-3 pr-4">
                <PanelTitle className="mb-0 text-sm text-default">Machine {machine.name}</PanelTitle>
                <p className="text-right text-2xs leading-tight text-muted/80">No incidents reported</p>
            </PanelWrapper>

            <section className="p-3"></section>
        </ViewerPanel>
    );
}
