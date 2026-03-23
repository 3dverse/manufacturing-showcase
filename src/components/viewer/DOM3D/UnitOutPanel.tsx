//------------------------------------------------------------------------------
import { BoundingBoxFaceProjection } from "@3dverse/livelink-react-ui";
import { Counter } from "@/components/common/Counter";
import { useEffect, useState } from "react";

//------------------------------------------------------------------------------
import type { ReactNode } from "react";
import type { Entity } from "@3dverse/livelink";

//------------------------------------------------------------------------------
export function UnitOutPanel({
    outEntity,
    unitCompleted,
    unitTotal,
    children,
}: {
    outEntity: Entity;
    unitCompleted: number;
    unitTotal: number;
    children?: ReactNode;
}) {
    //--------------------------------------------------------------------------
    // State
    const [_unitCompleted, setUnitCompleted] = useState(unitCompleted);

    // Increment every 1s
    useEffect(() => {
        const interval = setInterval(() => {
            setUnitCompleted((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    //--------------------------------------------------------------------------
    return (
        <BoundingBoxFaceProjection entity={outEntity} face="right" className="flex items-end">
            <p className="relative flex gap-1 h-fit w-full pl-2 pt-1 pb-7 pr-4 text-xs text-slate-0 rounded-sm border border-slate-0">
                <span role="decoration" className="absolute top-0 left-0 bg-slate-1000 w-20 h-8 blur-2xl " />
                <Counter number={_unitCompleted} className="translate-y-px" /> /{" "}
                <span className="font-normal">{unitTotal}</span> units
                {children}
            </p>
        </BoundingBoxFaceProjection>
    );
}
