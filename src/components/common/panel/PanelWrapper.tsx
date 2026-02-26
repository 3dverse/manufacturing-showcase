import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export const PanelWrapper = ({
    as = "div",
    className,
    children,
}: {
    as?: "div" | "header" | "footer";
    className?: string;
    children: React.ReactNode;
}) => {
    const Element = as;
    return <Element className={cn("px-4", className)}>{children}</Element>;
};
