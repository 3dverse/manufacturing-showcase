//------------------------------------------------------------------------------
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { SizeProp, FlipProp, RotateProp } from "@fortawesome/fontawesome-svg-core";
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";

//------------------------------------------------------------------------------
const variantLight = {
    color: "content.tertiary",
    filter: "drop-shadow(0px 14px 8px oklab(0 0 0 / .65))",
    style: {
        strokeWidth: "16px",
        stroke: "color-mix(in srgb, var(--color-bg-foreground) 85%, transparent)",
    },
};

const variantElevation = {
    color: "accent.500",
    filter: "drop-shadow(0px 8px 16px color-mix(in srgb, var(--color-accent) 90%, transparent))",
    style: {
        strokeWidth: "1.5px",
        stroke: "bg.ground",
    },
};

//------------------------------------------------------------------------------
export const Icon = ({
    variant,
    icon,
    size,
    fixedWidth,
    flip,
    rotation,
}: {
    variant?: "default" | "light" | "elevation";
    icon: IconDefinition;
    size?: SizeProp;
    fixedWidth?: boolean;
    flip?: FlipProp;
    rotation?: RotateProp;
}) => {
    //--------------------------------------------------------------------------
    const getVariantStyle = () => {
        if (variant === "light") {
            return variantLight;
        }
        if (variant === "elevation") {
            return variantElevation;
        }
    };

    //--------------------------------------------------------------------------
    return (
        <FontAwesomeIcon
            icon={icon}
            size={size}
            fixedWidth={fixedWidth}
            flip={flip}
            rotation={rotation}
            {...getVariantStyle()}
        />
    );
};
