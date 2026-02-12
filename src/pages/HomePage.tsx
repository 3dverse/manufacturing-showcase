import { factories } from "@/content/factory";

interface HomePageProps {
    onNavigate: (route: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <div className="container mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Manufacturing Showcase</h1>
                    <p className="text-lg text-slate-600 dark:text-slate-300">
                        Explore our digital twin factories around the world
                    </p>
                </div>

                {/* Factory Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {factories.map((factoryItem) => (
                        <div
                            key={factoryItem.id}
                            onClick={() => onNavigate(`/factory/${factoryItem.id}`)}
                            className="bg-white dark:bg-slate-800 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
                        >
                            {/* Card Content */}
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {factoryItem.name}
                                        </h2>
                                        <div className="flex items-center text-slate-600 dark:text-slate-400">
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
                                    <p className="text-slate-600 dark:text-slate-300 mb-4">{factoryItem.description}</p>
                                )}

                                {/* View Button */}
                                <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium group-hover:translate-x-1 transition-transform">
                                    <span>View Factory</span>
                                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </div>
                            </div>

                            {/* Bottom accent line */}
                            <div className="h-1 bg-linear-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="text-center mt-12">
                    <button
                        onClick={() => onNavigate("/theme")}
                        className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        Theme Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
