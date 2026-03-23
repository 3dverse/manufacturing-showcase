import React from "react";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "guidance";
    size?: "2xs" | "xs" | "sm" | "md" | "lg";
    isLoading?: boolean;
    children: React.ReactNode;
}

//------------------------------------------------------------------------------
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = "primary", size = "md", isLoading = false, disabled, className = "", children, ...props }, ref) => {
        //--------------------------------------------------------------------------
        const baseClasses =
            "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

        //--------------------------------------------------------------------------
        const variantClasses = {
            primary: "bg-accent-600 hover:bg-accent-700 text-white focus:ring-accent",
            secondary: "bg-neutral-600 hover:bg-neutral-700 text-white focus:ring-neutral",
            outline: "border-2 border-default bg-transparent hover:bg-ground text-default focus:ring-brand",
            ghost: "bg-transparent hover:bg-ground text-subtle hover:text-default focus:ring-brand",
            danger: "bg-negative-600 hover:bg-negative-700 text-white focus:ring-negative",
            guidance: "bg-guidance-600 hover:bg-guidance-700 text-white focus:ring-guidance",
        };

        //--------------------------------------------------------------------------
        const sizeClasses = {
            "2xs": "px-1 py-[2px] text-2xs font-normal rounded-sm",
            xs: "px-2 py-1 text-xs font-normal rounded-sm",
            sm: "px-3 py-1.5 text-sm",
            md: "px-4 py-2 text-base",
            lg: "px-6 py-3 text-lg",
        };

        //--------------------------------------------------------------------------
        const combinedClasses = cn(baseClasses, variantClasses[variant], sizeClasses[size], className);

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
