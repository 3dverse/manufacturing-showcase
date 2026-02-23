//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import { useFactoryStore } from "@/store/useFactoryStore";
import { useNavigate } from "@/hooks/useNavigate";
import { Icon } from "../common/Icon";
import { faGrid } from "@fortawesome/pro-solid-svg-icons";

//------------------------------------------------------------------------------
const MainNav = () => {
    const { currentFactory } = useFactoryStore();
    const navigate = useNavigate();

    //--------------------------------------------------------------------------
    const areas = [
        { name: "Area 1", lines: ["Line 1", "Line 2", "Line 3"], isActive: true },
        { name: "Area 2", lines: ["Line 1", "Line 2", "Line 3"] },
        { name: "Area 3", lines: ["Line 1", "Line 2", "Line 3"] },
    ];

    //--------------------------------------------------------------------------
    return (
        <ViewerPanel
            as="nav"
            className="h-fit flex divide-x divide-muted/50 rounded-md border border-muted/50 shadow-[-10px_10px_100px_35px_#ffffff50] overflow-hidden pointer-events-auto"
        >
            <div className="flex items-start p-2">
                <button
                    className="p-1 aspect-square rounded-sm text-xs text-accent bg-accent-100/50 transition-colors duration-200 cursor-pointer"
                    onClick={() => navigate("/")}
                >
                    <Icon icon={faGrid} size="lg" />
                </button>
            </div>
            <div className="flex flex-col divide-y divide-muted/50">
                <div className="flex items-baseline gap-2 px-3 py-2">
                    <p className="text-base font-medium">{currentFactory?.name}</p>
                    <p className="text-xs text-muted">{currentFactory?.location}</p>
                </div>
                <div className="p-1">
                    <ul className="flex items-center gap-1">
                        {areas.map((area) => (
                            <li
                                key={area.name}
                                className={cn(
                                    "flex flex-col gap-1 p-1 bg-muted/5 border border-muted/50 rounded-xl cursor-pointer",
                                    area.isActive ? "text-accent-100 bg-accent-500 border-accent-500" : "",
                                )}
                                style={
                                    {
                                        cornerShape: "squircle",
                                    } as React.CSSProperties
                                }
                            >
                                <p className="px-1 text-[70%] uppercase">{area.name}</p>
                                <ul className="flex gap-1">
                                    {area.lines.map((line, index) => (
                                        <li key={line}>
                                            <button
                                                className={cn(
                                                    "text-xs bg-[white]/60 hover:bg-[white] rounded-md px-3 py-1 cursor-pointer transition-colors duration-200",
                                                    area.isActive ? "bg-[white]/10 hover:bg-[white]/15" : "",
                                                    area.isActive && index === 0
                                                        ? "text-accent bg-white hover:bg-[white]"
                                                        : "",
                                                )}
                                                style={
                                                    {
                                                        cornerShape: "squircle",
                                                    } as React.CSSProperties
                                                }
                                            >
                                                {line}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </ViewerPanel>
    );
};

export default MainNav;
