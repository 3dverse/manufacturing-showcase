//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";

//------------------------------------------------------------------------------
import { QuadLayout } from "@/utils/QuadLayout";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { FactoryGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
export const TopPanel = ({ node, className }: { node: FactoryGraphNode; className?: string }) => {
    //--------------------------------------------------------------------------
    // Render
    return (
        <QuadLayout
            entity={node.entity}
            face="top"
            className="pointer-events-none"
            containerClassName="flex justify-end items-end scale-[-1_1] p-4"
            center={
                <ViewerPanel
                    className={cn(
                        "flex items-start gap-16 px-8 rounded-xl bg-positive-800/80 shadow-[0_16px_32px_-12px_color-mix(in_oklch,var(--color-positive-500),transparent)]",
                        className,
                    )}
                >
                    <p className="pt-8 text-5xl font-semibold text-slate-0 tracking-wide">OEE</p>
                    <p className="p-16 pb-4 relative text-8xl font-semibold text-positive-900 scale-[1.2] origin-bottom">
                        <span className="absolute bottom-0 left-0 right-0 w-full h-full rounded-t-[20rem] bg-positive-500 border-l-5 border-positive-400 -z-10 shadow-[-13px_0px_0px_-4px_#00000040]" />
                        95%
                    </p>
                </ViewerPanel>
            }
        />
    );
};
