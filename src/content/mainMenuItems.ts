import { mainMenuIcons } from "@/content/icons";

//------------------------------------------------------------------------------
export const mainMenuItems = [
    {
        label: "Home",
        icon: mainMenuIcons.dashboard,
        href: "",
    },
    {
        label: "Maintenance",
        icon: mainMenuIcons.maintenance,
        href: "/maintenance",
        isDisabled: true,
    },
    {
        label: "Security",
        icon: mainMenuIcons.security,
        href: "/security",
        isDisabled: true,
    },
    {
        label: "Energy",
        icon: mainMenuIcons.energy,
        href: "/energy",
        isDisabled: true,
    },
    {
        label: "Training",
        icon: mainMenuIcons.training,
        href: "/training",
        isDisabled: true,
    },
    {
        label: "Theme",
        icon: mainMenuIcons.theme,
        href: "/theme",
    },
    {
        label: "Settings",
        icon: mainMenuIcons.settings,
        href: "/settings",
        isDisabled: true,
    },
];
