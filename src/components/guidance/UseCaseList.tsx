import Button from "@/components/common/Button";

//------------------------------------------------------------------------------
import { CONTACT_URL, LANDING_3DVERSE_URL } from "@/content/routes";

//------------------------------------------------------------------------------
const MainGuidance = () => {
    const handleContact = () => {
        window.open(CONTACT_URL, "_blank", "noopener,noreferrer");
    };

    return (
        <aside
            data-theme="dark"
            className="relative w-full h-24 bg-neutral-100 text-default shadow-[0_-4px_32px_-1px_rgba(0,0,0,0.1)] overflow-hidden z-100"
        >
            <div className="flex items-center justify-between h-full px-10">
                <a href={LANDING_3DVERSE_URL} target="_blank" rel="noopener noreferrer" className="flex flex-col">
                    <p className="text-lg font-family-heading font-semibold">
                        <span className="text-guidance">3d</span>verse
                    </p>
                    <p className="text-xs text-subtle hidden sm:inline">Manufacturing 5.0</p>
                </a>

                <div className="relative flex-1 flex justify-center">
                    <h2 className="text-xs text-guidance tracking-wider font-normal bg-neutral-200/0 border border-guidance/30 rounded-md px-9 py-3">
                        Choose a use-case
                    </h2>
                    <span className="absolute -top-40 left-1/2 -translate-x-1/2 w-[50%] aspect-square rounded-full border border-subtle"></span>
                </div>

                <div>
                    <Button onClick={handleContact} variant="ghost" size="xs">
                        Contact 3dverse
                    </Button>
                </div>
            </div>
        </aside>
    );
};

export default MainGuidance;
