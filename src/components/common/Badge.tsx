import { cn } from "@/utils/cn";

export const Badge = ({ children, className }: { children: React.ReactNode; className?: string }) => {
    return (
        <p className={cn("w-fit text-2xs text-accent bg-accent-50/50 px-1 py-px rounded-sm", className)}>{children}</p>
    );
};
