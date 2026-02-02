import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export const PanelHeader = ({
    as = "div",
    className,
    children,
}: {
    as?: "div" | "header" | "footer";
    className?: string;
    children: React.ReactNode;
}) => {
    const Element = as;
    return <Element className={cn("text-xs uppercase tracking-wider", className)}>{children}</Element>;
};
