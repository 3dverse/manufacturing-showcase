import { faXmark } from "@fortawesome/pro-light-svg-icons";

import { Icon } from "@/components/common/Icon";
import Button from "@/components/common/Button";

//------------------------------------------------------------------------------
type Props = {
    title: string;
    onClose: () => void;
};

//------------------------------------------------------------------------------
export function ScadaModalHeader({ title, onClose }: Props) {
    return (
        <header className="sticky top-0 flex items-center justify-between pl-6 pr-3 py-2 bg-warning-700 text-slate-0 z-10">
            <h2 className="text-lg font-semibold">{title}</h2>
            <Button variant="ghost" colorScheme="warning" size="lg" className="px-2" onClick={onClose}>
                <Icon icon={faXmark} />
            </Button>
        </header>
    );
}
