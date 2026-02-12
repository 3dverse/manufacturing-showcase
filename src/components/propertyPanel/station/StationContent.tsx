//------------------------------------------------------------------------------
import { useState } from "react";
import { faCircleStar, faChartArea, faScrewdriverWrench, faShieldHalved } from "@fortawesome/pro-solid-svg-icons";

//------------------------------------------------------------------------------
import Button from "@/components/common/Button";
import { TabItem, Tabs } from "@/components/common/Tabs";
import { Icon } from "@/components/common/Icon";
import { TechnicalDocumentation } from "./sections/TechnicalDocumentation";
import { Production } from "./sections/Production";
import { Module } from "./module/Module";

//------------------------------------------------------------------------------
import { stations } from "@/content/stations";
import type { StationId } from "@/content/stations/enum";
import type { Module as ModuleType } from "@/content/stations/type";

//------------------------------------------------------------------------------
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
    const [activeTab, setActiveTab] = useState<string>("global");

    //--------------------------------------------------------------------------
    const station = stations[station_id];
    if (!station) {
        return null;
    }

    //--------------------------------------------------------------------------
    return (
        <section>
            <Wrapper as="header" className="py-2">
                <h3 className="text-sm font-semibold">{station.name}</h3>
                <p className="text-sm text-muted">{station.description}</p>
                {station.modules && <Module module={station.modules[0]} />}
            </Wrapper>

            {false && (
                <>
                    {activeTab === "global" ? (
                        <div className="flex border-t border-neutral-0">
                            <ul className="flex flex-col gap-px p-[2px] border-r border-neutral-0 bg-underground">
                                {sections.map((section) => (
                                    <li key={section.title}>
                                        <Button variant="ghost" size="2xs" className="group aspect-square">
                                            <Icon
                                                icon={section.icon}
                                                size="lg"
                                                className="fill-muted opacity-60 group-hover:opacity-100 transition-opacity duration-200"
                                            />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                            <div className="divide-y divide-neutral-0">
                                <Wrapper className="py-1">
                                    <Heading>Production</Heading>
                                    <Production module={station.modules?.[0]} />
                                </Wrapper>
                                <Wrapper className="py-1">
                                    <Heading>Maintenance</Heading>
                                </Wrapper>
                                <Wrapper className="py-1">
                                    <Heading>Security</Heading>
                                </Wrapper>
                                <Wrapper className="py-1">
                                    <Heading>Technical Documentation</Heading>
                                    <TechnicalDocumentation documentations={station.technical_documentations} />
                                </Wrapper>
                            </div>
                        </div>
                    ) : (
                        <Module module={station.modules?.find((module) => module.id === activeTab)} />
                    )}
                    <Navigation
                        modules={station.modules}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        className="p-1 bg-ground border-t border-neutral-0 "
                    />
                </>
            )}
        </section>
    );
};

//------------------------------------------------------------------------------
const Navigation = ({
    modules,
    activeTab,
    setActiveTab,
    className,
}: {
    modules: ModuleType[] | undefined;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    className?: string;
}) => {
    //--------------------------------------------------------------------------
    return (
        <Tabs className={cn("text-sm", className)}>
            <TabItem isActive={activeTab === "global"} onClick={() => setActiveTab("global")}>
                Global
            </TabItem>
            {modules?.map((module) => (
                <TabItem key={module.id} isActive={activeTab === module.id} onClick={() => setActiveTab(module.id)}>
                    {module.name}
                </TabItem>
            ))}
        </Tabs>
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
// const Box = ({ title, children }: { title: string; children?: React.ReactNode }) => {
//     return (
//         <div className="px-2 py-1 bg-ground/80 rounded border border-muted">
//             <h2 className="text-sm font-semibold">{title}</h2>
//             {children}
//         </div>
//     );
// };

//------------------------------------------------------------------------------
const Heading = ({ children }: { children: React.ReactNode }) => {
    return <h2 className="font-family-sans! text-[.8rem] font-medium text-subtle">{children}</h2>;
};
