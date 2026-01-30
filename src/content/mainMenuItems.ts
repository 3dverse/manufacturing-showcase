import { mainMenuIcons } from "@/content/icons";

//------------------------------------------------------------------------------
export const mainMenuItems = [
    {
        label: "Home",
        icon: mainMenuIcons.dashboard.light,
        href: "/",
    },
    {
        label: "Maintenance",
        icon: mainMenuIcons.maintenance.light,
        href: "/maintenance",
        isDisabled: true,
    },
    {
        label: "Security",
        icon: mainMenuIcons.security.light,
        href: "/security",
        isDisabled: true,
    },
    {
        label: "Energy",
        icon: mainMenuIcons.energy.light,
        href: "/energy",
        isDisabled: true,
    },
    {
        label: "Training",
        icon: mainMenuIcons.training.light,
        href: "/training",
        isDisabled: true,
    },
    {
        label: "Theme",
        icon: mainMenuIcons.theme.light,
        href: "/theme",
    },
    {
        label: "Settings",
        icon: mainMenuIcons.settings.light,
        href: "/settings",
        isDisabled: true,
    },
];
