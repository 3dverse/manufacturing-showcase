import { faCog, faHome, faPalette, faScrewdriverWrench } from "@fortawesome/sharp-light-svg-icons";

//------------------------------------------------------------------------------
export const mainMenuItems = [
    {
        label: "Home",
        icon: faHome,
        href: "/",
    },
    {
        label: "Maintenance",
        icon: faScrewdriverWrench,
        href: "/maintenance",
    },
    {
        label: "Theme",
        icon: faPalette,
        href: "/theme",
    },
    {
        label: "Settings",
        icon: faCog,
        href: "/settings",
    },
];
