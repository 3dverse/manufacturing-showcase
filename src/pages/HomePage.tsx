//------------------------------------------------------------------------------
import { Triangle } from "@/components/common/icons/Triangle";

//------------------------------------------------------------------------------
import { factories } from "@/content/factory";
import { useNavigate } from "@/hooks/useNavigate";

//------------------------------------------------------------------------------
export default function HomePage() {
    //--------------------------------------------------------------------------
    const navigate = useNavigate();

    //--------------------------------------------------------------------------
    return (
        <>
            <div className="h-full bg-linear-to-br from-slate-50 to-slate-100">
                <div className="container h-full mx-auto px-4 py-16">
                    {/* eslint-disable-next-line no-constant-binary-expression */}
                    {false && (
                        <header className="max-w-6xl mx-auto mb-16">
                            <h1 className="text-4xl font-bold mb-3">[Client Name]</h1>
                            <p className="text-subtle/80">[Client Description]</p>
                        </header>
                    )}

                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl h-full mx-auto">
                        {factories.map((factoryItem) => (
                            <li key={factoryItem.id}>
                                <button
                                    onClick={() => navigate(`/factory/${factoryItem.id}`)}
                                    className="relative w-full h-full text-left bg-slate-50 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
                                >
                                    <div className="flex">
                                        <div className="grow pl-7 pr-5 pt-5 pb-4">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <h2 className="text-2xl font-semibold mb-1 group-hover:text-accent transition-colors">
                                                        {factoryItem.name}
                                                    </h2>
                                                    <div className="flex items-center text-sm text-accent">
                                                        <svg
                                                            className="w-4 h-4 mr-2"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                                            />
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                                            />
                                                        </svg>
                                                        <span className="text-sm">{factoryItem.location}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {factoryItem.description && (
                                                <p className="text-sm text-subtle/80 mb-4">{factoryItem.description}</p>
                                            )}
                                        </div>
                                        <div className="flex flex-col text-left px-6 py-3 border-l border-slate-100">
                                            <p className="text-3xl font-semibold text-positive-800">
                                                97<span className="text-sm opacity-60">%</span>
                                            </p>
                                            <p>
                                                OEE <Triangle />
                                            </p>
                                        </div>
                                    </div>

                                    {/* Livelink preview */}
                                    <div className="w-full h-full p-4 bg-stripes rounded-lg border-t border-slate-100" />

                                    {/* Bottom accent line */}
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left z-10" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
    );
}
