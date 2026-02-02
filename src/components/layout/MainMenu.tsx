import { cn } from "@/utils/cn";
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";

//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { Icon } from "@/components/common/Icon";
import Tooltip from "@/components/common/Tooltip/Tooltip";

//------------------------------------------------------------------------------
import { mainMenuItems } from "@/content/mainMenuItems";

//------------------------------------------------------------------------------
const MenuItem = ({
    label,
    icon,
    isActive,
    isDisabled,
    onClick,
}: {
    label: string;
    icon: IconDefinition;
    isActive: boolean;
    isDisabled?: boolean;
    onClick: () => void;
}) => {
    return (
        <Tooltip content={label} position="right">
            <div
                onClick={onClick}
                className={cn(
                    "flex flex-col items-center justify-center gap-1 p-1 aspect-square rounded-md transition-colors duration-200 cursor-pointer",
                    "hover:bg-accent-500/5 hover:text-accent-500",
                    isActive ? "bg-accent-500! text-accent-100!" : "text-muted",
                    isDisabled ? "opacity-50 cursor-not-allowed" : "",
                )}
            >
                <Icon icon={icon} />
                <span className="hidden text-2xs text-muted">{label}</span>
            </div>
        </Tooltip>
    );
};

//------------------------------------------------------------------------------
const MainMenu = ({
    currentRoute,
    setCurrentRoute,
}: {
    currentRoute: string;
    setCurrentRoute: (route: string) => void;
}) => {
    return (
        <div className="absolute top-0 left-1 w-10 h-full flex flex-col justify-between items-center z-10">
            <span />
            <ViewerPanel className="w-10 h-fit rounded-lg pointer-events-auto">
                <div className="flex flex-col gap-px p-[2px]">
                    {mainMenuItems.map((item) => (
                        <MenuItem
                            key={item.label}
                            {...item}
                            isActive={currentRoute === item.href}
                            isDisabled={!!item.isDisabled}
                            onClick={() => setCurrentRoute(item.href)}
                        />
                    ))}
                </div>
            </ViewerPanel>
            <div className="pb-3">
                <div className="w-7 aspect-square rounded-full bg-accent-500 text-accent-100 text-2xs font-medium flex items-center justify-center">
                    BM
                </div>
            </div>
        </div>
    );
};

export default MainMenu;
