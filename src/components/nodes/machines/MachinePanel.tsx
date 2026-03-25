//------------------------------------------------------------------------------
import { faClock } from "@fortawesome/pro-light-svg-icons";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { PanelTitle, PanelWrapper } from "@/components/common/panel";

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

            <section className="p-3 flex items-start justify-start gap-4">
                <img
                    src="/assets/machine/Fanuc_M-950iA-500.webp"
                    alt={machine.name}
                    className="py-4 max-h-32 object-contain bg-foreground/50 rounded-md"
                />
                <div className="flex flex-col gap-1">
                    <div className="flex flex-col gap-1 grow">
                        <p className="text-sm text-default capitalize">{machine.name} M950iA-500</p>
                        <p className="text-xs text-muted/80">
                            <Icon icon={faClock} size="sm" className="text-muted/80 mr-1" />
                            <span className="tabular-nums">100% uptime</span>
                        </p>
                    </div>
                    <a href="" className="text-xs text-accent" target="_blank" rel="noopener noreferrer">
                        Open technical documentation
                    </a>
                </div>
            </section>
        </ViewerPanel>
    );
}
