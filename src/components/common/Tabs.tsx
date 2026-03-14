import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export const Tabs = ({ children, className }: { children: React.ReactNode; className?: string }) => {
    return <nav className={cn("flex gap-1", className)}>{children}</nav>;
};

//------------------------------------------------------------------------------
export const TabItem = ({
    children,
    isSelected,
    onClick,
    className,
}: {
    children: React.ReactNode;
    isSelected: boolean;
    onClick: () => void;
    className?: string;
}) => {
    return (
        <button
            className={cn(
                "px-3 py-1 font-medium text-neutral-500 bg-neutral-200/50 hover:text-neutral-800 hover:bg-neutral-100 rounded-sm cursor-pointer transition-colors duration-200",
                isSelected ? "text-neutral-0 bg-accent/80 hover:text-neutral-0 hover:bg-accent/90" : "",
                className,
            )}
            onClick={onClick}
        >
            {children}
        </button>
    );
};
