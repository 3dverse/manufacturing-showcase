//------------------------------------------------------------------------------
import Button from "@/components/common/Button";
import Modal from "@/components/common/modal/Modal";

//------------------------------------------------------------------------------
interface IntroductionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

//------------------------------------------------------------------------------
const IntroductionModal = ({ isOpen, onClose }: IntroductionModalProps) => {
    //--------------------------------------------------------------------------
    const handleContinue = () => {
        onClose();
    };

    //--------------------------------------------------------------------------
    if (!isOpen) {
        return null;
    }
    //--------------------------------------------------------------------------
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            showCloseButton={false}
            contentClassName="!max-w-5xl !h-[50%] !max-h-[80vh] !min-h-[30rem]"
            bodyClassName="p-0"
        >
            <div className="flex flex-col lg:flex-row h-full">
                {/* Video */}
                <div className="hidden lg:flex lg:w-96 bg-stripes border-r border-muted/50 p-6 lg:p-8 items-center justify-center">
                    <div className="w-full flex items-center justify-center overflow-hidden">
                        <div className="text-center p-4">
                            <p className="text-sm text-muted">Video</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col justify-center p-8 lg:p-12 overflow-y-auto">
                    <h1 className="text-2xl font-bold text-default mb-2">Welcome to Manufacturing 5.0</h1>
                    <p className="text-sm text-subtle mb-8 max-w-md">
                        Explore our cutting-edge manufacturing solutions with immersive 3D visualization. Discover how
                        we revolutionize industrial processes through innovative technology and design.
                    </p>

                    {/* 3 Small Items */}
                    <div className="hidden grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-ground rounded-lg p-4 border border-subtle">
                            <div className="w-10 h-10 bg-brand rounded-lg mb-3 flex items-center justify-center">
                                <span className="text-2xl">🎯</span>
                            </div>
                            <h3 className="text-lg font-semibold text-default mb-2">Precision</h3>
                            <p className="text-sm text-muted">Advanced manufacturing with millimeter accuracy</p>
                        </div>

                        <div className="bg-ground rounded-lg p-4 border border-subtle">
                            <div className="w-10 h-10 bg-accent rounded-lg mb-3 flex items-center justify-center">
                                <span className="text-2xl">⚡</span>
                            </div>
                            <h3 className="text-lg font-semibold text-default mb-2">Efficiency</h3>
                            <p className="text-sm text-muted">Streamlined processes for maximum productivity</p>
                        </div>

                        <div className="bg-ground rounded-lg p-4 border border-subtle">
                            <div className="w-10 h-10 bg-positive rounded-lg mb-3 flex items-center justify-center">
                                <span className="text-2xl">🌱</span>
                            </div>
                            <h3 className="text-lg font-semibold text-default mb-2">Sustainability</h3>
                            <p className="text-sm text-muted">Eco-friendly solutions for a better future</p>
                        </div>
                    </div>

                    <Button variant="guidance" className="w-fit min-w-56" onClick={handleContinue}>
                        Continue
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default IntroductionModal;
