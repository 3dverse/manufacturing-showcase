//------------------------------------------------------------------------------
import Button from "./Button";

//------------------------------------------------------------------------------
import { useTimelineStore } from "@/store/useTimelineStore";

//------------------------------------------------------------------------------
import { isNow, timeAgo } from "@/utils/helpers-time";

//------------------------------------------------------------------------------
export const Daytime = () => {
    //--------------------------------------------------------------------------
    const { asOf, setAsOf } = useTimelineStore();
    const asOfDate = new Date(asOf * 1000);
    const now = new Date();

    //--------------------------------------------------------------------------
    if (isNow(asOfDate, now)) {
        return null;
    }
    return (
        <div className="flex items-center p-1 text-xs text-accent-50 bg-accent-500/80 backdrop-blur-lg rounded pointer-events-auto">
            <p className="pl-2 capitalize tabular-nums">{timeAgo(asOfDate, undefined, { hour: "2-digit" })}</p>
            <Button
                size="xs"
                className="text-accent-50 text-2xs opacity-50 hover:opacity-100"
                onClick={() => setAsOf(Math.floor(Date.now() / 1000))}
            >
                Back to now
            </Button>
        </div>
    );
};
