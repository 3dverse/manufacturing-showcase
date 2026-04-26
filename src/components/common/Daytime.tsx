//------------------------------------------------------------------------------
import Button from "./Button";

//------------------------------------------------------------------------------
import { useTimelineStore } from "@/store/useTimelineStore";

//------------------------------------------------------------------------------
import { timeAgo } from "@/utils/helpers-time";
import { useCallback, useMemo } from "react";

//------------------------------------------------------------------------------
export const Daytime = () => {
    //--------------------------------------------------------------------------
    // Store
    const { asOf, setAsOf, present } = useTimelineStore();

    //--------------------------------------------------------------------------
    // Memos
    const asOfDate = useMemo(() => {
        return timeAgo(new Date((asOf || present) * 1000), undefined, { hour: "2-digit" });
    }, [asOf, present]);

    //--------------------------------------------------------------------------
    // Handlers
    const resetHandler = useCallback(() => {
        setAsOf(undefined);
    }, [setAsOf]);

    //--------------------------------------------------------------------------
    if (!asOf) {
        return null;
    }
    return (
        <>
            <div className="absolute -z-1 top-0 left-0 right-0 w-full h-full outline-16 outline-accent-500/60 -outline-offset-16 starting:scale-105 scale-100 transition-all duration-200 pointer-events-none" />
            <div className="flex flex-col items-center gap-2 min-w-36 pt-2 px-4 -translate-y-2 text-center text-accent-50 bg-accent-500/80 backdrop-blur-lg rounded-b starting:-translate-y-3 starting:opacity-0 opacity-100 transition-all duration-200 delay-50 pointer-events-auto">
                <p className="text-sm font-medium tabular-nums">{asOfDate}</p>
                <Button
                    size="xs"
                    className="text-accent-50 text-2xs bg-accent-800/80 hover:bg-accent-800 opacity-80 hover:opacity-100 rounded-b-none"
                    onClick={resetHandler}
                >
                    Back to now
                </Button>
            </div>
        </>
    );
};
