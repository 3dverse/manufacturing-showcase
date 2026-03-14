import { useEffect, useState, type ReactNode } from "react";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const OverlayShroud = ({
    backdropUrl,
    transition,
    children,
}: {
    backdropUrl?: string;
    transition?: boolean;
    children: ReactNode;
}) => {
    //--------------------------------------------------------------------------
    // State
    const [visible, setVisible] = useState(false);

    //--------------------------------------------------------------------------
    // Effects
    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));
    }, []);

    //--------------------------------------------------------------------------
    // Render
    return (
        <div
            className={cn(
                "absolute inset-0 z-50 flex items-center justify-center overflow-hidden",
                transition ? "transition-opacity duration-500" : "",
                visible ? "opacity-100" : "opacity-0",
            )}
        >
            {backdropUrl && (
                <img src={backdropUrl} alt="" className="absolute inset-0 h-full w-full object-cover grayscale" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-accent-500 via-accent-500 to-black mix-blend-screen" />

            <div className="absolute inset-0 backdrop-blur-xs" />

            <div className="relative z-10">{children}</div>
        </div>
    );
};
