import { faCheck } from "@fortawesome/sharp-regular-svg-icons";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";

//------------------------------------------------------------------------------
import { CONNECTED_SYSTEMS } from "./content";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export const ConnectedSystemsBadge = ({ className }: { className?: string }) => {
    return (
        <div
            className={cn(
                "flex items-center gap-1 bg-positive-500 border border-positive-500/20 text-neutral-600 rounded-full",
                className,
            )}
        >
            <Icon icon={faCheck} className="text-2xs pl-1.5 pr-5 text-positive-50" />
            {CONNECTED_SYSTEMS.map((system) => (
                <span
                    key={system}
                    className="bg-slate-0 h-full rounded-full px-1 py-px text-2xs -ml-5 pl-2 pr-5 last:pr-2 outline outline-positive-500/50"
                >
                    {system}
                </span>
            ))}
        </div>
    );
};
