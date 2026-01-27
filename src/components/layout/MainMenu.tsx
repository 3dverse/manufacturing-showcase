import { cn } from "@/utils/cn";
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";
import { faCog, faHome, faScrewdriverWrench } from "@fortawesome/sharp-light-svg-icons";

//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { Icon } from "@/components/common/Icon";
import Tooltip from "@/components/common/Tooltip/Tooltip";

//------------------------------------------------------------------------------
const menuItems = [
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
        label: "Settings",
        icon: faCog,
        href: "/settings",
    },
];

//------------------------------------------------------------------------------
const MenuItem = ({ label, icon, href }: { label: string; icon: IconDefinition; href: string }) => {
    const isActive = label === "Home";
    return (
        <Tooltip content={label} position="right">
            <div
                className={cn(
                    "flex flex-col items-center justify-center gap-1 p-1 aspect-square rounded-md transition-colors duration-200 cursor-pointer",
                    "hover:bg-accent-900/40 hover:text-accent-600",
                    isActive ? "bg-accent-800! text-accent-400!" : "text-muted",
                )}
            >
                <Icon icon={icon} size="lg" />
                <span className="hidden text-2xs text-muted">{label}</span>
            </div>
        </Tooltip>
    );
};

const MainMenu = () => {
    return (
        <ViewerPanel className="absolute top-1/2 left-1 w-12 h-fit -translate-y-1/2 z-10 rounded-lg pointer-events-auto">
            <div className="flex flex-col gap-px p-[2px]">
                {menuItems.map((item) => (
                    <MenuItem key={item.label} {...item} />
                ))}
            </div>
        </ViewerPanel>
    );
};

export default MainMenu;
