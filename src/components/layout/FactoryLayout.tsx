//------------------------------------------------------------------------------
import Viewer from "@/components/viewer/Viewer";
import MainHeader from "@/components/layout/MainHeader";
import MainNav from "@/components/layout/MainNav";

//------------------------------------------------------------------------------
import { SelectedContextProvider } from "@/contexts/SelectedContext";

//------------------------------------------------------------------------------
const FactoryLayout = ({ currentRoute }: { currentRoute: string }) => {
    //--------------------------------------------------------------------------
    console.log("FactoryLayout", currentRoute);

    //--------------------------------------------------------------------------
    return (
        <SelectedContextProvider>
            <div className="relative flex-1">
                <Viewer />
                <div className="absolute bottom-0 left-0 flex flex-col w-full h-full p-2 pointer-events-none">
                    <MainHeader className="self-start" />
                    <div className="flex items-end justify-center grow pb-8">
                        <MainNav />
                    </div>
                </div>
            </div>
        </SelectedContextProvider>
    );
};

export default FactoryLayout;
