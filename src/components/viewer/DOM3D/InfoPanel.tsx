//------------------------------------------------------------------------------
import { type ReactNode } from "react";
import { BoundingBoxFaceProjection } from "@3dverse/livelink-react-ui";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { PanelWrapper } from "@/components/common/panel";

//------------------------------------------------------------------------------
import type { SceneGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
export function InfoPanel({
    node,
    warning,
    extra,
    children,
}: {
    node: SceneGraphNode;
    warning?: ReactNode;
    extra: ReactNode;
    children: ReactNode;
}) {
    //--------------------------------------------------------------------------
    // Render
    return (
        <BoundingBoxFaceProjection
            entity={node.entity}
            face="right"
            className="flex flex-col justify-end gap-3 transform-3d pointer-events-none"
        >
            {warning && (
                <ViewerPanel className="backdrop-blur-none transform-[translateZ(-.1px)] relative min-w-80 max-w-96 bg-warning-700 shadow-[0_-4px_56px_-1px_var(--color-warning-500)] [corner-shape:bevel] starting:opacity-0 starting:translate-y-8 opacity-100 translate-y-0 translate-x-[80%] transition-all duration-400 delay-500 transform-3d">
                    <PanelWrapper className="py-2 flex justify-between items-center gap-8 transform-3d">
                        {warning}
                    </PanelWrapper>
                </ViewerPanel>
            )}
            <ViewerPanel
                className={cn(
                    "min-w-80 max-w-96 rounded-xl border-2 border-slate-0/50 shadow-lg [corner-shape:bevel] [outline:2px_solid_#ffffff90] outline-offset-2 translate-x-[80%] starting:translate-x-[60%] transition-transform duration-400",
                )}
            >
                <PanelWrapper className="py-3 px-2 space-y-3">{children}</PanelWrapper>
            </ViewerPanel>
            {extra}
        </BoundingBoxFaceProjection>
    );
}
