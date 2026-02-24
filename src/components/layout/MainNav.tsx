//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";

//------------------------------------------------------------------------------
import { useSelectedContext } from "@/contexts/SelectedContext";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
const MainNav = () => {
    const { sorted, selected, setSelected } = useSelectedContext();
    const { areas } = sorted;

    //--------------------------------------------------------------------------
    const handleAreaClick = (areaId: string) => {
        setSelected({ kind: "area", id: areaId, entity: areas.find((area) => area.name === areaId) });
    };

    //--------------------------------------------------------------------------
    const handleLineClick = (areaId: string, lineId: string) => {
        setSelected({
            kind: "line",
            id: lineId,
            entity: areas.find((area) => area.name === areaId)?.children.find((line) => line.name === lineId),
        });
    };

    //--------------------------------------------------------------------------
    return (
        <ViewerPanel
            as="nav"
            className="h-fit flex divide-x divide-muted/50 rounded-md border border-muted/50 shadow-[-10px_10px_100px_35px_#ffffff50] overflow-hidden pointer-events-auto"
        >
            <div className="flex flex-col divide-y divide-muted/50">
                <div className="p-1">
                    <ul className="flex items-center gap-1">
                        {areas.map((area) => (
                            <li
                                key={area.name}
                                className={cn(
                                    "flex flex-col gap-1 p-1 bg-muted/5 border border-muted/50 rounded-xl cursor-pointer",
                                    selected?.id === area.name ? "text-accent-100 bg-accent-500 border-accent-500" : "",
                                )}
                                style={
                                    {
                                        cornerShape: "squircle",
                                    } as React.CSSProperties
                                }
                                onClick={() => handleAreaClick(area.name)}
                            >
                                <p className="px-1 text-[70%] uppercase">{area.name}</p>
                                <ul className="flex gap-1">
                                    {["Line 1 ", "Line 2", "Line 3"].map((line) => (
                                        <li key={line}>
                                            <button
                                                className={cn(
                                                    "text-xs bg-[white]/60 hover:bg-[white] rounded-md px-3 py-1 cursor-pointer transition-colors duration-200",
                                                    selected?.kind === "area"
                                                        ? "bg-[white]/10 hover:bg-[white]/15"
                                                        : "",
                                                    selected?.kind === "area" && line === selected?.id
                                                        ? "text-accent bg-white hover:bg-[white]"
                                                        : "",
                                                )}
                                                style={
                                                    {
                                                        cornerShape: "squircle",
                                                    } as React.CSSProperties
                                                }
                                                onClick={() => handleLineClick(area.name, line)}
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
