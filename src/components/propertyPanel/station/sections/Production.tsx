//------------------------------------------------------------------------------
import { faCartShopping } from "@fortawesome/pro-solid-svg-icons";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";

//------------------------------------------------------------------------------
export const Production = ({ module }: { module: ModuleType }) => {
    //--------------------------------------------------------------------------
    return (
        <ul className="py-1">
            <li>
                <Icon
                    icon={faCartShopping}
                    size="xs"
                    className="group-hover:text-accent text-muted transition-colors duration-200 mt-1"
                />
                Units picked: {module.states?.[0]?.units_picked}
            </li>
        </ul>
    );
};
