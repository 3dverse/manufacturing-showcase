//------------------------------------------------------------------------------
import { useRef, useEffect, useState } from "react";
import { DOM3DElement, DOM3DOverlay } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import type { DebugElement } from "@/utils/trash";

//------------------------------------------------------------------------------
export const DebugOverlay = () => {
    //--------------------------------------------------------------------------
    // Refs
    const domOverlayRef = useRef<HTMLDivElement>(null);

    //--------------------------------------------------------------------------
    const [debugPoints, setDebugPoints] = useState<DebugElement[]>([]);

    //--------------------------------------------------------------------------
    useEffect(() => {
        const onDebug3d = (ev: Event) => {
            console.log("on debug!", ev);
            const { detail } = ev as CustomEvent<DebugElement[]>;
            setDebugPoints(detail);
        };

        window.addEventListener("debug3d", onDebug3d);
        return () => window.removeEventListener("debug3d", onDebug3d);
    }, []);

    //--------------------------------------------------------------------------
    return (
        <div ref={domOverlayRef}>
            <DOM3DOverlay>{debugPoints?.map((i, index) => <DebugItem key={index} item={i} />)}</DOM3DOverlay>
        </div>
    );
};

//------------------------------------------------------------------------------
const DebugItem = ({ item }: { item: DebugElement }) => {
    return (
        <DOM3DElement worldPosition={item.position}>
            <div className="h-4 w-auto px-2 items-center justify-center bg-black text-xs text-white rounded-full">
                {item.label}
            </div>
        </DOM3DElement>
    );
};
