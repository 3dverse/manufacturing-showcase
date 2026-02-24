import { useSelectedContext } from "@/contexts/SelectedContext";
import { ProductionAreaWidget } from "@/components/viewer/ProductionAreaWidget";

//------------------------------------------------------------------------------
const FactoryBuilder = () => {
    const { elements, selectedElement, setSelectedElementById } = useSelectedContext();

    const { areas } = elements;

    return (
        <>
            {areas.map((area) => (
                <ProductionAreaWidget
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
