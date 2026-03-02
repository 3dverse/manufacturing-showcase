//------------------------------------------------------------------------------
import { LANDING_3DVERSE_URL } from "@/content/routes";
import { useCases } from "@/content/useCases";

//------------------------------------------------------------------------------
const MainGuidance = () => {
    //--------------------------------------------------------------------------
    return (
        <aside
            data-theme="dark"
            className="relative w-full shrink-0 h-24 bg-slate-0 text-default shadow-[0_-4px_32px_-1px_color-mix(in_oklch,var(--color-accent-200)_20%,transparent)] overflow-hidden z-100"
        >
            <div className="flex items-center justify-between h-full px-10">
                <a href={LANDING_3DVERSE_URL} target="_blank" rel="noopener noreferrer" className="flex flex-col">
                    <p className="text-lg font-family-heading font-semibold">
                        <span className="text-guidance">3d</span>verse
                    </p>
                    <p className="text-xs text-subtle hidden sm:inline">Manufacturing 5.0</p>
                </a>

                <div className="relative flex-1 flex flex-col text-center items-center justify-center">
                    <h2 className="text-sm font-semibold">Explore use cases</h2>
                    <ul className="list-none flex items-start gap-2 mt-2">
                        {useCases.map((useCase, index) => (
                            <li
                                key={index}
                                className="flex items-center text-left text-subtle hover:text-default transition-colors duration-200 w-48 bg-slate-200/0 border border-slate-300 rounded-sm overflow-hidden cursor-pointer"
                            >
                                <img src={useCase.image} alt={useCase.name} className="w-12 h-12 object-cover" />
                                <p className="py-px px-3 text-xs">{useCase.name}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </aside>
    );
};

export default MainGuidance;
