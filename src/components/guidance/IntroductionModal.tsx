import Modal from "@/components/common/Modal";

//------------------------------------------------------------------------------
interface IntroductionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

//------------------------------------------------------------------------------
const IntroductionModal = ({ isOpen, onClose }: IntroductionModalProps) => {
    const handleContinue = () => {
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            showCloseButton={false}
            contentClassName="!max-w-7xl !h-full !max-h-[80vh]"
            bodyClassName="p-0"
        >
            <div className="flex flex-col lg:flex-row h-full">
                {/* Video */}
                <div className="hidden lg:flex lg:w-96 bg-underground p-6 lg:p-8 items-center justify-center border-t lg:border-t-0 lg:border-l border-subtle">
                    <div className="w-full aspect-video bg-ground rounded-lg border border-subtle flex items-center justify-center overflow-hidden">
                        {/* Video placeholder - replace with actual video element */}
                        <div className="text-center p-4">
                            <div className="w-16 h-16 mx-auto mb-4 bg-brand-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-brand-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                </svg>
                            </div>
                            <p className="text-sm text-muted">
                                Video placeholder
                                <br />
                                <span className="text-xs">Add your video here</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col p-8 lg:p-12 overflow-y-auto">
                    {/* Title */}
                    <h1 className="text-4xl lg:text-5xl font-bold text-default mb-4">
                        Welcome to Manufacturing Showcase
                    </h1>

                    {/* Description */}
                    <p className="text-lg text-subtle mb-8 max-w-2xl">
                        Explore our cutting-edge manufacturing solutions with immersive 3D visualization. Discover how
                        we revolutionize industrial processes through innovative technology and design.
                    </p>

                    {/* 3 Small Items */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-ground rounded-lg p-4 border border-subtle">
                            <div className="w-10 h-10 bg-brand-500 rounded-lg mb-3 flex items-center justify-center">
                                <span className="text-2xl">🎯</span>
                            </div>
                            <h3 className="text-lg font-semibold text-default mb-2">Precision</h3>
                            <p className="text-sm text-muted">Advanced manufacturing with millimeter accuracy</p>
                        </div>

                        <div className="bg-ground rounded-lg p-4 border border-subtle">
                            <div className="w-10 h-10 bg-accent-500 rounded-lg mb-3 flex items-center justify-center">
                                <span className="text-2xl">⚡</span>
                            </div>
                            <h3 className="text-lg font-semibold text-default mb-2">Efficiency</h3>
                            <p className="text-sm text-muted">Streamlined processes for maximum productivity</p>
                        </div>

                        <div className="bg-ground rounded-lg p-4 border border-subtle">
                            <div className="w-10 h-10 bg-positive-500 rounded-lg mb-3 flex items-center justify-center">
                                <span className="text-2xl">🌱</span>
                            </div>
                            <h3 className="text-lg font-semibold text-default mb-2">Sustainability</h3>
                            <p className="text-sm text-muted">Eco-friendly solutions for a better future</p>
                        </div>
                    </div>

                    {/* Continue Button */}
                    <button
                        onClick={handleContinue}
                        className="mt-auto w-full lg:w-auto px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white text-lg font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                    >
                        Continue
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default IntroductionModal;
