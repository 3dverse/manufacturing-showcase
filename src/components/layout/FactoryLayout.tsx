//------------------------------------------------------------------------------
import MainNav from "@/components/layout/MainNav";
import Viewer from "@/components/viewer/Viewer";

//------------------------------------------------------------------------------
const FactoryLayout = ({ currentRoute }: { currentRoute: string }) => {
    //--------------------------------------------------------------------------
    console.log("FactoryLayout", currentRoute);

    //--------------------------------------------------------------------------
    return (
        <div className="relative flex-1">
            <Viewer />
            <div className="absolute bottom-0 left-0 w-full h-full flex p-2 pointer-events-none">
                <MainNav />
            </div>
        </div>
    );
};

export default FactoryLayout;
