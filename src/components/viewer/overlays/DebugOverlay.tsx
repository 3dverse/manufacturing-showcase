//------------------------------------------------------------------------------
import { useRef, useEffect, useState } from "react";
import { DOM3DAnchor, DOM3DDiv, DOM3DOverlay } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import type { DebugElement } from "@/utils/trash";

//------------------------------------------------------------------------------
export const DebugOverlay = () => {
    //--------------------------------------------------------------------------
    const domOverlayRef = useRef<HTMLDivElement>(null);

    //--------------------------------------------------------------------------
    const [debugElements, setDebugElements] = useState<DebugElement[]>([]);

    //--------------------------------------------------------------------------
    useEffect(() => {
        const onDebug3d = (ev: Event) => {
            console.log("on debug!", ev);
            const { detail } = ev as CustomEvent<DebugElement[]>;
            setDebugElements(detail);
        };

        window.addEventListener("debug3d", onDebug3d);
        return () => window.removeEventListener("debug3d", onDebug3d);
    }, []);

    //--------------------------------------------------------------------------
    return (
        <div ref={domOverlayRef} className="pointer-events-none">
            <DOM3DOverlay>
                {debugElements?.map((item, index) => (
                    <DebugItem key={index} item={item} />
                ))}
            </DOM3DOverlay>
        </div>
    );
};

//------------------------------------------------------------------------------
const DebugItem = ({ item }: { item: DebugElement }) => {
    if ("quad" in item) {
        return (
            <DOM3DDiv
                worldQuad={item.quad}
                title={item.title}
                className={`${item.className ?? "bg-yellow-400/20 border-dashed border-2 border-yellow-600/80"} p-1 text-xs text-black pointer-events-none! z-100`}
            >
                {item.label}
            </DOM3DDiv>
        );
    }

    return (
        <DOM3DAnchor worldPosition={item.position}>
            <div title={item.title} className="flex flex-col items-start gap-0.5">
                <div className="h-4 w-auto px-2 items-center justify-center bg-black text-xs text-white rounded-full z-100">
                    {item.label}
                </div>
            </div>
        </DOM3DAnchor>
    );
};
