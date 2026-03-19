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
        <Badge variant="positive" className={cn("flex flex-col items-start", className)}>
            {!hideLabel && <span className="text-[50%] leading-tight">OEE</span>}
            <p>
                {oee}
                <span className=" font-semibold text-[50%] leading-tight opacity-80 ml-1">%</span>
            </p>
        </Badge>
    );
};
