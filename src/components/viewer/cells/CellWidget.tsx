//------------------------------------------------------------------------------
import { QuadLayout } from "@/utils/QuadLayout";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { CellNode } from "@/content/type";

//------------------------------------------------------------------------------
export function CellWidget({
    cell,
    isSelected = false,
    onClick,
}: {
    cell: CellNode;
    isSelected?: boolean;
    onClick?: () => void;
}) {
    return (
        <>
            <QuadLayout
                entity={cell.entity}
                face="bottom"
                center={
                    <div
                        className={cn(
                            "w-full h-full bg-slate-0/20 rounded-xl transition-colors duration-200",
                            isSelected ? "" : "bg-slate-0/50 hover:bg-slate-0/70 cursor-pointer",
                        )}
                        onClick={onClick}
                    ></div>
                }
            />
            <QuadLayout
                entity={cell.entity}
                face="right"
                center={
                    <div
                        className={cn(
                            "w-full h-full border-2 rounded-xl border-slate-0 transition-colors duration-200",
                            isSelected ? "opacity-0" : "hover:bg-slate-0/40 cursor-pointer",
                        )}
                        onClick={onClick}
                    >
                        <p className="text-slate-800 text-lg capitalize px-4 py-2">{cell.name} CELL</p>
                    </div>
                }
            />
        </>
    );
}
