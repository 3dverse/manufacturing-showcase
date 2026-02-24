//------------------------------------------------------------------------------
import { AreaWidget } from "@/components/viewer/AreaWidget";

//------------------------------------------------------------------------------
import { useSelectedContext } from "@/contexts/SelectedContext";

//------------------------------------------------------------------------------
const FactoryBuilder = () => {
    //--------------------------------------------------------------------------
    const { elements, selectedElement, setSelectedElementById } = useSelectedContext();
    const { areas } = elements;

    //--------------------------------------------------------------------------
    return (
        <>
            {areas.map((area) => (
                <AreaWidget
                    key={area.id}
                    area={area}
                    isSelected={selectedElement?.id === area.id}
                    onClick={() => setSelectedElementById(area.id)}
                />
            ))}
        </>
    );
};

export default FactoryBuilder;
