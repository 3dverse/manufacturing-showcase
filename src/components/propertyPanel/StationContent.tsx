//------------------------------------------------------------------------------
import { faCircleStar, faChartArea, faScrewdriverWrench, faShieldHalved } from "@fortawesome/pro-solid-svg-icons";

import Button from "@/components/common/Button";
import { Icon } from "@/components/common/Icon";

//------------------------------------------------------------------------------
import { stations } from "@/content/stations";
import type { StationId } from "@/content/stations/enum";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
const sections = [
    {
        title: "Quality",
        icon: faCircleStar,
    },
    {
        title: "Production",
        icon: faChartArea,
    },
    {
        title: "Maintenance",
        icon: faScrewdriverWrench,
    },
    {
        title: "Security",
        icon: faShieldHalved,
    },
];

//------------------------------------------------------------------------------
export const StationContent = ({ station_id }: { station_id: StationId }) => {
    //--------------------------------------------------------------------------
    const station = stations[station_id];
    if (!station) {
        return null;
    }

    //--------------------------------------------------------------------------
    return (
        <article>
            <Wrapper as="header" className="py-2">
                <h3 className="text-sm font-semibold">{station.name}</h3>
                <p className="text-sm text-muted">{station.description}</p>
                <p className="text-sm text-muted">{station.technical_information.join(", ")}</p>
            </Wrapper>
            <div className="flex border-t border-neutral-0">
                <Wrapper className="grow py-2">
                    <div>
                        <Heading>Quality</Heading>
                    </div>
                    <div>
                        <Heading>Production</Heading>
                    </div>
                    <div>
                        <Heading>Maintenance</Heading>
                    </div>
                    <div>
                        <Heading>Security</Heading>
                    </div>
                </Wrapper>
                <ul className="flex flex-col gap-px p-1 border-l border-neutral-0 bg-underground">
                    {sections.map((section) => (
                        <li key={section.title}>
                            <Button variant="ghost" size="2xs" className="aspect-square">
                                <Icon icon={section.icon} size="lg" className="fill-muted opacity-80" />
                            </Button>
                        </li>
                    ))}
                </ul>
            </div>
        </article>
    );
};

//------------------------------------------------------------------------------
const Wrapper = ({
    as = "div",
    className,
    children,
}: {
    as?: "div" | "header" | "footer";
    className?: string;
    children: React.ReactNode;
}) => {
    const Element = as;
    return <Element className={cn("px-3", className)}>{children}</Element>;
};

//------------------------------------------------------------------------------
const Box = ({ title, children }: { title: string; children?: React.ReactNode }) => {
    return (
        <div className="px-2 py-1 bg-ground/80 rounded border border-muted">
            <h2 className="text-sm font-semibold">{title}</h2>
            {children}
        </div>
    );
};

//------------------------------------------------------------------------------
const Heading = ({ children }: { children: React.ReactNode }) => {
    return <h2 className="text-sm font-semibold">{children}</h2>;
};
