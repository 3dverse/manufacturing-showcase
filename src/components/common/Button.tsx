import React from "react";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
type ButtonSize = "2xs" | "xs" | "sm" | "md" | "lg";
type ResponsiveBreakpoint = "base" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
type ResponsiveButtonSize = Partial<Record<ResponsiveBreakpoint, ButtonSize>>;
type ButtonVariant = "plain" | "outline" | "ghost" | "soft";
type ButtonColorScheme = "accent" | "neutral" | "positive" | "negative" | "guidance" | "warning";

//------------------------------------------------------------------------------
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    colorScheme?: ButtonColorScheme;
    size?: ButtonSize | ResponsiveButtonSize;
    mobileSize?: ButtonSize;
    isLoading?: boolean;
    children: React.ReactNode;
}

//------------------------------------------------------------------------------
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = "plain",
            colorScheme,
            size = "md",
            mobileSize,
            isLoading = false,
            disabled,
            className = "",
            children,
            ...props
        },
        ref,
    ) => {
        //--------------------------------------------------------------------------
        const baseClasses =
            "inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

        //--------------------------------------------------------------------------
        const resolvedVariant: ButtonVariant = variant;
        const resolvedColorScheme: ButtonColorScheme = colorScheme ?? "accent";

        const variantClasses: Record<ButtonVariant, Record<ButtonColorScheme, string>> = {
            plain: {
                accent: "bg-accent-600 hover:bg-accent-700 text-white focus:ring-accent",
                neutral: "bg-neutral-600 hover:bg-neutral-700 text-white focus:ring-neutral",
                positive: "bg-positive-600 hover:bg-positive-700 text-white focus:ring-positive",
                negative: "bg-negative-600 hover:bg-negative-700 text-white focus:ring-negative",
                guidance: "bg-guidance-600 hover:bg-guidance-500 text-guidance-50 focus:ring-guidance",
                warning: "bg-warning-600 hover:bg-warning-700 text-warning-50 focus:ring-warning",
            },
            outline: {
                accent: "border-2 border-accent-600 bg-transparent hover:bg-accent-50 text-accent-700 focus:ring-accent",
                neutral:
                    "border-2 border-neutral-500 bg-transparent hover:bg-neutral-100 text-neutral-700 focus:ring-neutral",
                positive:
                    "border-2 border-positive-500 bg-transparent hover:bg-positive-50 text-positive-700 focus:ring-positive",
                negative:
                    "border-2 border-negative-500 bg-transparent hover:bg-negative-50 text-negative-700 focus:ring-negative",
                guidance:
                    "border-2 border-guidance-500 bg-transparent hover:bg-guidance-50 text-guidance-700 focus:ring-guidance",
                warning:
                    "border-2 border-warning-500 bg-transparent hover:bg-warning-50 text-warning-700 focus:ring-warning",
            },
            ghost: {
                accent: "bg-transparent hover:bg-accent-50 text-accent-700 focus:ring-accent",
                neutral: "bg-transparent hover:bg-neutral-100 text-neutral-700 focus:ring-neutral",
                positive: "bg-transparent hover:bg-positive-50 text-positive-700 focus:ring-positive",
                negative: "bg-transparent hover:bg-negative-50 text-negative-700 focus:ring-negative",
                guidance: "bg-transparent hover:bg-guidance-50 text-guidance-700 focus:ring-guidance",
                warning: "bg-transparent hover:bg-warning-50 text-warning-700 focus:ring-warning",
            },
            soft: {
                accent: "bg-accent-100 hover:bg-accent-200 text-accent-800 focus:ring-accent",
                neutral: "bg-neutral-200 hover:bg-neutral-300 text-neutral-800 focus:ring-neutral",
                positive: "bg-positive-100 hover:bg-positive-200 text-positive-800 focus:ring-positive",
                negative: "bg-negative-100 hover:bg-negative-200 text-negative-800 focus:ring-negative",
                guidance: "bg-guidance-100 hover:bg-guidance-200 text-guidance-800 focus:ring-guidance",
                warning: "bg-warning-100 hover:bg-warning-200 text-warning-800 focus:ring-warning",
            },
        };

        //--------------------------------------------------------------------------
        const sizeClasses: Record<ButtonSize, string> = {
            "2xs": "px-1 py-[2px] text-2xs font-normal rounded-sm",
            xs: "px-2 py-1 text-xs font-normal rounded-sm",
            sm: "px-4 py-1.5 text-sm rounded-sm",
            md: "px-5 py-2 text-base rounded-sm",
            lg: "px-6 py-3 text-lg rounded-lg",
        };

        //--------------------------------------------------------------------------
        const getResponsiveClasses = (classes: string, breakpoint: Exclude<ResponsiveBreakpoint, "base">) =>
            classes
                .split(" ")
                .filter(Boolean)
                .map((className) => `${breakpoint}:${className}`)
                .join(" ");

        const breakpointOrder: ResponsiveBreakpoint[] = ["base", "xs", "sm", "md", "lg", "xl", "2xl"];
        const sizeMap: ResponsiveButtonSize =
            typeof size === "string" ? (mobileSize ? { base: mobileSize, md: size } : { base: size }) : size;

        const resolvedSizeClasses =
            Object.entries(sizeMap)
                .sort(
                    ([a], [b]) =>
                        breakpointOrder.indexOf(a as ResponsiveBreakpoint) -
                        breakpointOrder.indexOf(b as ResponsiveBreakpoint),
                )
                .map(([breakpoint, breakpointSize]) =>
                    breakpoint === "base"
                        ? sizeClasses[breakpointSize as ButtonSize]
                        : getResponsiveClasses(
                              sizeClasses[breakpointSize as ButtonSize],
                              breakpoint as Exclude<ResponsiveBreakpoint, "base">,
                          ),
                )
                .join(" ") || sizeClasses.md;

        const combinedClasses = cn(
            baseClasses,
            variantClasses[resolvedVariant][resolvedColorScheme],
            resolvedSizeClasses,
            className,
        );

        //--------------------------------------------------------------------------
        return (
            <button ref={ref} className={combinedClasses} disabled={disabled || isLoading} {...props}>
                {isLoading && (
                    <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                )}
                {children}
            </button>
        );
    },
);

Button.displayName = "Button";

export default Button;
