//------------------------------------------------------------------------------
import { useMemo } from "react";
import type { IconType } from "react-icons";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
const FA_SIZE_MAP: Record<string, string> = {
    "2xs": "0.625em",
    xs: "0.75em",
    sm: "0.875em",
    lg: "1.25em",
    xl: "1.5em",
    "2xl": "2em",
};

//------------------------------------------------------------------------------
export const Icon = ({
    icon: IconComponent,
    size,
    fixedWidth,
    className,
}: {
    icon: IconType;
    size?: string;
    fixedWidth?: boolean;
    className?: string;
}) => {
    //--------------------------------------------------------------------------
    // Memos
    const _className = useMemo(() => cn(className, "inline-block"), [className]);

    //--------------------------------------------------------------------------
    return (
        <IconComponent
            size={size ? (FA_SIZE_MAP[size] ?? size) : undefined}
            style={fixedWidth ? { minWidth: "1em" } : undefined}
            className={_className}
        />
    );
};
