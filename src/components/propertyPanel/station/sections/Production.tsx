//------------------------------------------------------------------------------
import { faCartShopping } from "@fortawesome/pro-solid-svg-icons";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";

//------------------------------------------------------------------------------
export const Production = ({ units_picked }: { units_picked: number }) => {
    //--------------------------------------------------------------------------
    return (
        <ul className="py-1">
            <li>
                <Icon
                    icon={faCartShopping}
                    size="xs"
                    className="group-hover:text-accent text-muted transition-colors duration-200 mt-1"
                />
                Units picked: {units_picked}
            </li>
        </ul>
    );
};
