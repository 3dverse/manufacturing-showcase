//------------------------------------------------------------------------------
import { BoundingBoxFaceProjection } from "@3dverse/livelink-react-ui";

//------------------------------------------------------------------------------
import { PanelTitle, PanelWrapper, PanelShadow, PanelAnchorLine } from "@/components/common/panel";
import { ViewerPanel } from "@/components/common/ViewerPanel";

//------------------------------------------------------------------------------
import type { ReactNode } from "react";
import type { NavGraphNode } from "@/content/type";
import { BadgeOEE } from "@/components/common/BadgeOEE";

//------------------------------------------------------------------------------
export function AnchoredPanel({ node, children }: { node: NavGraphNode; children?: ReactNode }) {
    return (
        <BoundingBoxFaceProjection
            entity={node.entity}
            face="right"
            className="flex items-end p-8 transform-3d pointer-events-none!"
        >
            <ViewerPanel className="h-fit w-fit bg-slate-0/80 rounded-xl [corner-shape:bevel] [outline:2px_solid_#ffffff90] outline-offset-3 transform-3d appear-in-from-bottom opacity-0 [--animation-delay:1s]">
                <PanelWrapper className="py-4">
                    <div className="flex items-start justify-between gap-1 mb-0">
                        <PanelTitle>
                            {node.name} {node.type}
                        </PanelTitle>
                        <BadgeOEE oee={89} className="text-2xl -translate-y-8 px-3 py-2 shadow-xl" />
                    </div>
                    {children}
                </PanelWrapper>
            </ViewerPanel>
        </BoundingBoxFaceProjection>
    );
}

//------------------------------------------------------------------------------
export function AnchoredPanel2({ node, children }: { node: NavGraphNode; children?: ReactNode }) {
    //--------------------------------------------------------------------------
    return (
        <BoundingBoxFaceProjection
            entity={node.entity}
            face="right"
            // className="relative flex flex-col justify-end items-start w-fit h-full backdrop-blur-md bg-accent/80"
            className="flex flex-col gap-4  mb-1 text-base rounded-xl shadow-none backdrop-blur-md bg-slate-0/80 [outline:2px_solid_#ffffff90] outline-offset-3 pointer-events-auto"
            style={
                {
                    width: "20rem",
                    height: "10rem",
                    cornerShape: "bevel",
                } as React.CSSProperties
            }
        >
            <PanelShadow />

            <PanelWrapper className="py-4">
                <PanelTitle>
                    {node.name} {node.type}
                </PanelTitle>
                {children}
            </PanelWrapper>

            <PanelAnchorLine />
        </BoundingBoxFaceProjection>
    );
}
