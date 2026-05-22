import type { HTMLAttributes } from "react";
import { FaCheck } from "react-icons/fa";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";

//------------------------------------------------------------------------------
import { DEFAULT_CONNECTIONS, SYSTEM_FULL_NAMES, Systems } from "./content";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
type ConnectedSystemsBadgeProps = HTMLAttributes<HTMLDivElement>;

//------------------------------------------------------------------------------
export const ConnectedSystemsBadge = ({ className, ...props }: ConnectedSystemsBadgeProps) => {
    return (
        <div
            {...props}
            className={cn(
                "flex items-center gap-1 bg-positive-500 border border-positive-500/20 text-neutral-600 rounded-full",
                className,
            )}
        >
            <Icon icon={FaCheck} className="text-2xs pl-1.5 pr-5 text-positive-50" />
            {Object.entries(DEFAULT_CONNECTIONS)
                .filter(([, value]) => value)
                .map(([key]) => (
                    <span
                        key={key}
                        title={SYSTEM_FULL_NAMES[key as Systems]}
                        className="bg-slate-0 h-full rounded-full px-1 py-px text-2xs -ml-5 pl-2 pr-5 last:pr-2 outline outline-positive-500/50"
                    >
                        {key}
                    </span>
                ))}
        </div>
    );
};
