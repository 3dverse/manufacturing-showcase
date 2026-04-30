//------------------------------------------------------------------------------
export const SidePanel = ({ children }: { children: React.ReactNode }) => {

    //--------------------------------------------------------------------------
    return (
        <aside className="fixed top-0 right-0 w-96 h-full bg-white border-l border-gray-200">
            <div className="p-4">
                <h1 className="text-2xl font-bold">Side Panel</h1>
                {children}
            </div>
        </aside>
    );
};