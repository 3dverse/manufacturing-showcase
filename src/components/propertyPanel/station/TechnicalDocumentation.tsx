//------------------------------------------------------------------------------
import { faFilePdf } from "@fortawesome/pro-solid-svg-icons";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";

//------------------------------------------------------------------------------
export const TechnicalDocumentation = ({ documentations }: { documentations?: string[] }) => {
    //--------------------------------------------------------------------------
    if (!documentations || documentations.length === 0) {
        return <p className="text-xs text-muted">No technical documentation available</p>;
    }
    //--------------------------------------------------------------------------
    return (
        <ul className="py-1">
            {documentations?.map((documentation) => (
                <li key={documentation}>
                    <a
                        href={documentation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-start gap-2 text-xs text-muted bg-ground/80 hover:text-subtle hover:bg-ground px-2 py-1 rounded-sm transition-all duration-200"
                    >
                        <Icon
                            icon={faFilePdf}
                            size="xs"
                            className="group-hover:text-accent text-muted transition-colors duration-200 mt-1"
                        />
                        {documentation}
                    </a>
                </li>
            ))}
        </ul>
    );
};
