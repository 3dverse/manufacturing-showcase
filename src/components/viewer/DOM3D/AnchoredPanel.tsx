//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { PanelTitle, PanelWrapper, PanelShadow, PanelAnchorLine } from "@/components/common/panel";

//------------------------------------------------------------------------------
import { QuadLayout } from "@/utils/QuadLayout";

//------------------------------------------------------------------------------
import type { ReactNode } from "react";
import type { FactoryGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
export function AnchoredPanel({ node, children }: { node: FactoryGraphNode; children?: ReactNode }) {
    //--------------------------------------------------------------------------
    return (
        <QuadLayout
            entity={node.entity}
            face="right"
            center={
                <div className="relative flex flex-col justify-end items-start w-fit h-full">
                    <PanelShadow />
                    <ViewerPanel
                        className="flex flex-col gap-4 w-fit mb-1 text-base rounded-xl shadow-none [outline:2px_solid_#ffffff90] outline-offset-3 pointer-events-auto"
                        style={{
                            cornerShape: "bevel",
                        }}
                    >
                        <PanelWrapper className="py-4">
                            <PanelTitle>
                                {node.name} {node.type}
                            </PanelTitle>
                            {children}
                        </PanelWrapper>
                    </ViewerPanel>
                    <PanelAnchorLine />
                </div>
            }
            className="pointer-events-none"
        />
    );
}
