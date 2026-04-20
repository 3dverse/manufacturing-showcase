import { cn } from "@/utils/cn";
import { Badge } from "./Badge";

export const BadgeOEE = ({
    oee,
    className,
    hideLabel = false,
}: {
    oee: number;
    className?: string;
    hideLabel?: boolean;
}) => {
    return (
        <Badge variant="positive" className={cn("flex flex-col justify-center items-start", className)}>
            {!hideLabel && <span className="text-[50%] leading-tight text-neutral-0">OEE</span>}
            <p className="font-semibold leading-none">
                {oee}
                <span className="text-[50%] leading-tight text-neutral-0 ml-[.5ex]">%</span>
            </p>
        </Badge>
    );
};
