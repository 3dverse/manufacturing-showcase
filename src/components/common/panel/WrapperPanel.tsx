import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export const WrapperPanel = ({ className, children }: { className?: string; children: React.ReactNode }) => {
    return (
        <div className={cn("px-4", className)}>
            {children}
        </div>
    );
};