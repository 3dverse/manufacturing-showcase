//------------------------------------------------------------------------------
import { useContext } from "react";

//------------------------------------------------------------------------------
import Button from "@/components/common/Button";
import Modal from "@/components/common/modal/Modal";

//------------------------------------------------------------------------------
import { ScenarioContext } from "@/contexts/ScenariosContext";
import { APP_OWNER_NAME } from "@/content/metadata";
import { Icon } from "../common/Icon";
import {
    faMagnifyingGlassWaveform,
    faBusinessTime,
    faSensorTriangleExclamation,
} from "@fortawesome/sharp-light-svg-icons";

//------------------------------------------------------------------------------
const keyPoints = [
    {
        icon: faMagnifyingGlassWaveform,
        title: "Understanding the operational impact",
        description:
            "When production is interrupted, the biggest delay is often not the machine; it is understanding the operational impact across orders, maintenance, and production.",
    },
    {
        icon: faBusinessTime,
        title: "Connected operational environment",
        description:
            "Hypervision connects the factory floor, manufacturing operations, and enterprise systems into a single operational environment without duplicating existing workflows or infrastructure.",
    },
    {
        icon: faSensorTriangleExclamation,
        title: "Investigate incidents",
        description:
            "Teams can investigate incidents, evaluate production impact, coordinate remotely, and review operational scenarios using the same connected operational context.",
    },
];

//------------------------------------------------------------------------------
interface IntroductionModalProps {
    isOpen: boolean;
    onClose: () => void;
}
//------------------------------------------------------------------------------
const IntroductionModal = ({ isOpen, onClose }: IntroductionModalProps) => {
    //--------------------------------------------------------------------------
    const { activateScenario, scenarios } = useContext(ScenarioContext);

    const handleContinue = () => {
        onClose();
    };

    const handleExploreScenarios = () => {
        const first = scenarios.find((s) => !s.disabled);
        if (first) activateScenario(first.id);
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
            variant="bottomSheet"
            closeOnOverlayClick
            isFullScreen
        >
            <div className="flex flex-col lg:flex-row justify-center h-dvh">
                <div className="flex-1 flex flex-col justify-end md:justify-center p-0 md:p-8 overflow-y-auto max-w-3xl text-pretty">
                    <header>
                        <h1 className="text-4xl md:text-5xl font-bold text-default">Hypervision</h1>
                        <p className="mt-2 md:mt-3 text-accent text-sm md:text-base font-medium">
                            For {APP_OWNER_NAME}
                        </p>
                    </header>

                    <ul className="hidden list-disc flex-col gap-1 pl-4 *:pl-4 marker:text-guidance marker:text-3xl marker:-translate-y-4">
                        <li>
                            <p>
                                When production is interrupted, the biggest delay is often not the machine ; it is
                                understanding the operational impact across orders, maintenance, and production.
                            </p>
                        </li>
                        <li>
                            <p>
                                Hypervision connects the factory floor, manufacturing operations, and enterprise systems
                                into a single operational environment without duplicating existing workflows or
                                infrastructure.
                            </p>
                        </li>
                        <li>
                            <p>
                                Teams can investigate incidents, evaluate production impact, coordinate remotely, and
                                review operational scenarios using the same connected operational context.
                            </p>
                        </li>
                    </ul>

                    <div className="flex flex-col gap-8 my-10">
                        {keyPoints.map(({ icon, title, description }, index) => (
                            <div key={index} className="flex flex-col md:flex-row gap-x-8 gap-y-2">
                                <Icon
                                    icon={icon}
                                    className="text-2xl md:text-3xl text-accent drop-shadow-[8px_11px_30px_var(--color-accent)] *:drop-shadow-[142px_200px_26px_white]"
                                />
                                <div>
                                    <h3 className="text-lg md:text-xl font-semibold text-default mb-1 md:mb-2">
                                        {title}
                                    </h3>
                                    <p className="text-subtle text-sm md:text-base">{description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <footer className="flex flex-col md:flex-row gap-4">
                        <Button
                            variant="plain"
                            colorScheme="guidance"
                            size={{ base: "lg", sm: "md" }}
                            className="md:w-fit min-w-80"
                            onClick={handleContinue}
                        >
                            Continue
                        </Button>
                        <Button
                            variant="ghost"
                            colorScheme="guidance"
                            size={{ base: "lg", sm: "md" }}
                            onClick={handleExploreScenarios}
                        >
                            Explore scenarios
                        </Button>
                    </footer>
                </div>
            </div>
        </Modal>
    );
};

export default IntroductionModal;
