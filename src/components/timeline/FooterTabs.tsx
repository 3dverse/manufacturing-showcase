//------------------------------------------------------------------------------
import { useContext } from "react";
import { faChartGantt, faListTree } from "@fortawesome/pro-light-svg-icons";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";
import Button from "@/components/common/Button";
import { Tabs } from "@/components/common/Tabs";

//------------------------------------------------------------------------------
import { FooterTabsContext } from "@/contexts/FooterTabsContext";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export function FooterTabs({ className }: { className?: string }) {
    //--------------------------------------------------------------------------
    // Contexts
    const { footerTab, setFooterTab } = useContext(FooterTabsContext);

    //--------------------------------------------------------------------------
    // Render
    return (
        <Tabs className={cn("pointer-events-auto gap-0", className)}>
            <Button
                size="sm"
                variant={footerTab === "timeline" ? "plain" : "soft"}
                title="Timeline"
                className="px-1 rounded-r-none"
                onClick={() => setFooterTab("timeline")}
            >
                <Icon icon={faChartGantt} size="xs" />
            </Button>
            <Button
                size="sm"
                variant={footerTab === "bom" ? "plain" : "soft"}
                title="Bill of Materials"
                className="px-1 rounded-l-none"
                onClick={() => setFooterTab("bom")}
            >
                <Icon icon={faListTree} size="xs" />
            </Button>
        </Tabs>
    );
}
