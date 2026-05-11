import type { Meta, StoryObj } from "@storybook/react-vite";

import { ClientProductLogo } from "@/components/common/icons/ClientProductLogo";

//------------------------------------------------------------------------------
const meta = {
    title: "Components/Logo",
    component: ClientProductLogo,
    parameters: {
        layout: "centered",
    },
    args: {
        className: "w-20",
        isLoading: false,
    },
} satisfies Meta<typeof ClientProductLogo>;

export default meta;
type Story = StoryObj<typeof meta>;

//------------------------------------------------------------------------------
export const Logo: Story = {};
