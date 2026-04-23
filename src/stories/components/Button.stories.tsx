import type { Meta, StoryObj } from "@storybook/react-vite";

import Button from "@/components/common/Button";

//------------------------------------------------------------------------------
const meta = {
    title: "Components/Button",
    component: Button,
    args: {
        children: "Button",
        variant: "plain",
        colorScheme: "accent",
        size: "md",
        disabled: false,
        isLoading: false,
    },
    argTypes: {
        variant: {
            control: "select",
            options: ["plain", "outline", "ghost", "soft"],
        },
        colorScheme: {
            control: "select",
            options: ["accent", "neutral", "positive", "negative", "guidance", "warning"],
        },
        size: {
            control: "select",
            options: ["2xs", "xs", "sm", "md", "lg"],
        },
    },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

//------------------------------------------------------------------------------
export const Playground: Story = {};

//------------------------------------------------------------------------------
export const VariantsAndColorSchemes: Story = {
    render: () => {
        const variants = ["plain", "soft", "outline", "ghost"] as const;
        const colorSchemes = ["accent", "neutral", "positive", "negative", "guidance", "warning"] as const;

        return (
            <div className="flex flex-col gap-4 p-4">
                {variants.map((variant) => (
                    <div key={variant} className="flex flex-col gap-2">
                        <p className="text-sm font-medium capitalize">{variant}</p>
                        <div className="flex flex-wrap gap-2">
                            {colorSchemes.map((colorScheme) => (
                                <Button
                                    key={`${variant}-${colorScheme}`}
                                    variant={variant}
                                    colorScheme={colorScheme}
                                    size="sm"
                                >
                                    {colorScheme}
                                </Button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    },
};
