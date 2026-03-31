import { useContext } from "react";
import { faChartGantt, faListTree } from "@fortawesome/pro-light-svg-icons";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";
import { Tabs, TabItem } from "@/components/common/Tabs";
import { FooterTabsContext } from "@/contexts/FooterTabsContext";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export function FooterTabs() {
    //--------------------------------------------------------------------------
    // Contexts
    const { footerTab, setFooterTab } = useContext(FooterTabsContext);

    //--------------------------------------------------------------------------
    // Render
    return (
        <div className="pointer-events-auto flex pb-1">
            <Tabs>
                <TabItem
                    isSelected={footerTab === "timeline"}
                    onClick={() => setFooterTab("timeline")}
                    title="Timeline"
                    className="w-6 h-6 rounded !px-0 !py-0 flex items-center justify-center bg-neutral-200 hover:bg-neutral-100"
                    selectedClassName="bg-accent hover:bg-accent/90"
                >
                    <Icon icon={faChartGantt} />
                </TabItem>
                <TabItem
                    isSelected={footerTab === "bom"}
                    onClick={() => setFooterTab("bom")}
                    title="Bill of Materials"
                    className="w-6 h-6 rounded !px-0 !py-0 flex items-center justify-center bg-neutral-200 hover:bg-neutral-100"
                    selectedClassName="bg-accent hover:bg-accent/90"
                >
                    <Icon icon={faListTree} />
                </TabItem>
            </Tabs>
        </div>
    );
}
