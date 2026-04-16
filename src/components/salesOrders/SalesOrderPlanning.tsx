//------------------------------------------------------------------------------
import { useState } from "react";
import { faList, faTimeline } from "@fortawesome/pro-light-svg-icons";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";
import { PanelLabel } from "@/components/common/panel";
import Button from "@/components/common/Button";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import { SalesOrderList } from "./SalesOrderList";
import { SalesOrderTimeline } from "./SalesOrderTimeline";

//------------------------------------------------------------------------------
type ViewMode = "list" | "timeline";

//------------------------------------------------------------------------------
export const SalesOrderPlanning = () => {
    const [mode, setMode] = useState<ViewMode>("timeline");

    //--------------------------------------------------------------------------
    return (
        <div className="@container flex flex-col gap-1">
            <header className="flex items-center gap-2">
                <PanelLabel className="text-xs text-default">Sales Order Planning</PanelLabel>
                <a href="#" className="text-2xs text-accent mr-auto">
                    All orders
                </a>
                <div className="flex items-center rounded-sm border border-muted p-px">
                    <Button
                        title="Timeline view"
                        variant="ghost"
                        size="sm"
                        onClick={() => setMode("timeline")}
                        className={cn(
                            "w-auto p-1.5 rounded-sm",
                            mode === "timeline"
                                ? "bg-accent/80! text-accent-50!"
                                : "text-muted hover:text-default hover:bg-underground",
                        )}
                    >
                        <Icon icon={faTimeline} size="xs" />
                    </Button>
                    <Button
                        title="List view"
                        variant="ghost"
                        size="sm"
                        onClick={() => setMode("list")}
                        className={cn(
                            "w-auto p-1.5 rounded-sm",
                            mode === "list"
                                ? "bg-accent/80! text-accent-50!"
                                : "text-muted hover:text-default hover:bg-underground",
                        )}
                    >
                        <Icon icon={faList} size="xs" />
                    </Button>
                </div>
            </header>

            {mode === "list" ? <SalesOrderList /> : <SalesOrderTimeline />}
        </div>
    );
};
