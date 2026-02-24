//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";

//------------------------------------------------------------------------------
import { useSelectedContext } from "@/contexts/SelectedContext";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
const MainNav = () => {
    //--------------------------------------------------------------------------
    const { elements, selectedElement, setSelectedElementById } = useSelectedContext();
    const { areas } = elements;

    //--------------------------------------------------------------------------
    const handleAreaClick = (areaId: string) => {
        setSelectedElementById(areaId);
    };

    //--------------------------------------------------------------------------
    if (areas.length === 0) return null;

    //--------------------------------------------------------------------------
    return (
        <ViewerPanel
            as="nav"
            className="h-fit flex divide-x divide-muted/50 rounded-md border border-muted/50 shadow-[-10px_10px_100px_35px_#ffffff50] overflow-hidden pointer-events-auto appear-in-from-bottom"
        >
            <div className="flex flex-col divide-y divide-muted/50">
                <div className="p-1">
                    <ul className="flex items-center gap-1">
                        {areas.map((area) => (
                            <li
                                key={area.id}
                                className={cn(
                                    "flex flex-col gap-1 p-1 bg-muted/5 border border-muted/50 rounded-xl cursor-pointer",
                                    selectedElement?.id === area.id
                                        ? "text-accent-100 bg-accent-500 border-accent-500"
                                        : "",
                                )}
                                style={
                                    {
                                        cornerShape: "squircle",
                                    } as React.CSSProperties
                                }
                                onClick={() => handleAreaClick(area.id)}
                            >
                                <p className="px-1 text-[70%] uppercase">{area.category} Area</p>
                                <ul className="flex gap-1">
                                    {["Line 1 ", "Line 2", "Line 3"].map((line) => (
                                        <li key={line}>
                                            <button
                                                className={cn(
                                                    "text-xs bg-[white]/60 hover:bg-[white] rounded-md px-3 py-1 cursor-pointer transition-colors duration-200",
                                                    selectedElement?.type === "area"
                                                        ? "bg-[white]/10 hover:bg-[white]/15"
                                                        : "",
                                                    selectedElement?.type === "area" && line === selectedElement?.id
                                                        ? "text-accent bg-white hover:bg-[white]"
                                                        : "",
                                                )}
                                                style={
                                                    {
                                                        cornerShape: "squircle",
                                                    } as React.CSSProperties
                                                }
                                                // onClick={() => handleLineClick(area.name, line)}
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
