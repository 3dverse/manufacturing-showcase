import { cn } from "@/utils/cn";

export type ScrollableAreaOrientation = "vertical" | "horizontal";

type ScrollableAreaProps = React.HTMLAttributes<HTMLDivElement> & {
    orientation?: ScrollableAreaOrientation;
};

export const ScrollableArea = ({ className, orientation = "vertical", children, ...props }: ScrollableAreaProps) => {
    return (
        <div
            {...props}
            className={cn("scrollable-area", `scrollable-area--${orientation}`, className)}
            data-orientation={orientation}
        >
            {children}
        </div>
    );
};
