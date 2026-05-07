import type { HTMLAttributes } from "react";
import { faCheck, faXmark } from "@fortawesome/sharp-regular-svg-icons";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";

//------------------------------------------------------------------------------
import { Systems } from "./content";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
type ConnectedSystemBadgeProps = HTMLAttributes<HTMLDivElement> & {
    system: Systems;
    connected?: boolean;
};

//------------------------------------------------------------------------------
export const ConnectedSystemBadge = ({ system, connected, className, ...props }: ConnectedSystemBadgeProps) => {
    return (
        <div
            {...props}
            className={cn(
                "flex items-center border rounded-full mx-3",
                connected === true && "bg-positive-500 border-positive-500/20 text-neutral-600",
                connected === false && "bg-neutral-700 border-neutral-600/20 text-neutral-400",
                connected === undefined && "bg-transparent border-2 border-white text-white",
                className,
            )}
        >
            {connected !== undefined && (
                <Icon
                    icon={connected ? faCheck : faXmark}
                    className={cn("text-2xs pl-1.5 pr-5", connected ? "text-positive-50" : "text-neutral-400")}
                />
            )}
            <span
                className={cn(
                    "h-full rounded-full px-1 py-px text-2xs font-semibold pr-2",
                    connected !== undefined ? "-ml-5 pl-2" : "pl-2",
                )}
            >
                {system}
            </span>
        </div>
    );
};
