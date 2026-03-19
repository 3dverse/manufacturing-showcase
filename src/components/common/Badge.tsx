import { cn } from "@/utils/cn";

export const Badge = ({
    children,
    className,
    variant = "accent",
}: {
    children: React.ReactNode;
    className?: string;
    variant?: "accent" | "positive";
}) => {
    const variantClasses = {
        accent: "text-accent bg-accent-50/50",
        positive: "text-positive-800 bg-positive-200/80",
    };
    return (
        <div className={cn("w-fit text-2xs px-1 py-px rounded-sm", variantClasses[variant], className)}>{children}</div>
    );
};
