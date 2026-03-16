//------------------------------------------------------------------------------
import { BoundingBoxFaceProjection } from "@3dverse/livelink-react-ui";

//------------------------------------------------------------------------------
import { PanelTitle, PanelWrapper, PanelShadow, PanelAnchorLine } from "@/components/common/panel";
import { ViewerPanel } from "@/components/common/ViewerPanel";

//------------------------------------------------------------------------------
import { QuadLayout } from "@/utils/QuadLayout";

//------------------------------------------------------------------------------
import type { ReactNode } from "react";
import type { NavGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
export function AnchoredPanel({ node, children }: { node: NavGraphNode; children?: ReactNode }) {
    return (
        <QuadLayout
            entity={node.entity}
            face="right"
            className="pointer-events-none z-10"
            center={
                <div className="relative flex flex-col justify-end items-start w-fit h-full">
                    <PanelShadow />
                    <ViewerPanel
                        className="flex flex-col gap-4 w-fit mb-1 text-base rounded-xl shadow-none [outline:2px_solid_#ffffff90] outline-offset-3 pointer-events-auto"
                        style={
                            {
                                cornerShape: "bevel",
                            } as React.CSSProperties
                        }
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
        />
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
