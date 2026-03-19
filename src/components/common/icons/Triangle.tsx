import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export const Triangle = ({ className }: { className?: string }) => {
    return (
        <span
            role="img"
            className={cn("inline-block w-2 aspect-[2/1.3] bg-positive-700", className)}
            style={{
                clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
            }}
        />
    );
};
