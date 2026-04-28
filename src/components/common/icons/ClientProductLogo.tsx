import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export const ClientProductLogo = ({ className }: { className?: string }) => {
    return (
        <span
            role="img"
            className={cn(
                "block w-8 aspect-square rounded-xl rotate-45 [border-color:#7577df50] border-inset border-10 [corner-shape:scoop] bg-linear-to-tr from-accent-200 to-accent-500 shadow-[0_4px_16px_-8px_var(--color-accent)]",
                className,
            )}
        />
    );
};
