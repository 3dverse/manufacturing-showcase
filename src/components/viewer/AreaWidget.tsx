//------------------------------------------------------------------------------
import type { Element } from "@/contexts/SelectedContext";

//------------------------------------------------------------------------------
import { QuadLayout } from "@/utils/QuadLayout";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export function AreaWidget({
    area,
    isSelected = false,
    onClick,
}: {
    area: Element;
    isSelected?: boolean;
    onClick?: () => void;
}) {
    return (
        <div className="pointer-events-auto">
            <QuadLayout
                entity={area.entity}
                face="bottom"
                center={
                    <div
                        className={cn(
                            "w-full h-full cursor-pointer rounded-xl outline-accent-500/20 transition-colors duration-200",
                            isSelected ? "outline-100 " : "bg-accent-500/10 hover:bg-accent-500/20",
                        )}
                        onClick={onClick}
                    />
                }
                right={
                    <div
                        className="w-full h-full p-4 text-accent align-left uppercase"
                        style={{
                            textOrientation: "mixed",
                            writingMode: "sideways-lr",
                        }}
                    >
                        {area.category} AREA
                    </div>
                }
            />
        </div>
    );
}
