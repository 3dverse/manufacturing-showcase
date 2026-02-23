//------------------------------------------------------------------------------
import { useState } from "react";
import { faGrid } from "@fortawesome/pro-solid-svg-icons";

//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { Icon } from "@/components/common/Icon";

//------------------------------------------------------------------------------
import { useFactoryStore } from "@/store/useFactoryStore";
import { useNavigate } from "@/hooks/useNavigate";
import { cn } from "@/utils/cn";

//--------------------------------------------------------------------------
const areas = [
    { id: 1, name: "Supply Area", lines: ["Line 1", "Line 2", "Line 3"] },
    { id: 2, name: "Production Area", lines: ["Line 1", "Line 2", "Line 3"] },
    { id: 3, name: "Quality control Area", lines: ["Control 1"] },
    { id: 4, name: "Storage Area", lines: ["Rack 1", "Rack 2"] },
];

//------------------------------------------------------------------------------
const MainNav = () => {
    const { currentFactory } = useFactoryStore();
    const navigate = useNavigate();

    //--------------------------------------------------------------------------
    const [activeAreaId, setActiveAreaId] = useState<number>(2);
    const [activeLine, setActiveLine] = useState<string>("Line 1");

    //--------------------------------------------------------------------------
    const handleAreaClick = (areaId: number) => {
        setActiveAreaId(areaId);
        setActiveLine("Line 1");
    };

    //--------------------------------------------------------------------------
    const handleLineClick = (areaId: number, line: string) => {
        console.log("handleLineClick", areaId, line);
        setActiveLine(line);
        setActiveAreaId(areaId);
    };

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
                                    area.id === activeAreaId ? "text-accent-100 bg-accent-500 border-accent-500" : "",
                                )}
                                style={
                                    {
                                        cornerShape: "squircle",
                                    } as React.CSSProperties
                                }
                                onClick={() => handleAreaClick(area.id)}
                            >
                                <p className="px-1 text-[70%] uppercase">{area.name}</p>
                                <ul className="flex gap-1">
                                    {area.lines.map((line) => (
                                        <li key={line}>
                                            <button
                                                className={cn(
                                                    "text-xs bg-[white]/60 hover:bg-[white] rounded-md px-3 py-1 cursor-pointer transition-colors duration-200",
                                                    area.id === activeAreaId ? "bg-[white]/10 hover:bg-[white]/15" : "",
                                                    area.id === activeAreaId && line === activeLine
                                                        ? "text-accent bg-white hover:bg-[white]"
                                                        : "",
                                                )}
                                                style={
                                                    {
                                                        cornerShape: "squircle",
                                                    } as React.CSSProperties
                                                }
                                                onClick={() => handleLineClick(area.id, line)}
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
