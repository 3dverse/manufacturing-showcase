import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export const ClientProductLogo = ({ className, isLoading }: { className?: string; isLoading?: boolean }) => {
    return (
        <div className={cn("@container/logo w-8 aspect-square", className)}>
            <span
                role="img"
                className={cn(
                    "block w-full h-full rotate-45 border-[#7577df50]! border-inset [corner-shape:scoop] bg-linear-to-tr from-accent-200 to-accent-500 shadow-[0_4px_16px_-8px_var(--color-accent)]",
                    "[border-width:calc(1cqw*34)] rounded-[calc(1cqw*40)]",
                    isLoading &&
                        "animate-[client-product-logo-border_1s_ease-in-out_alternate_infinite] outline-1 outline-offset-2 outline-accent-200",
                )}
            />
        </div>
    );
};
