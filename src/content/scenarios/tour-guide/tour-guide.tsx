import type { ScenarioDefinition } from "../types";

export const tourGuide: ScenarioDefinition = {
    id: "tour_guide",
    title: "Tour guide",
    description:
        "A business-oriented walkthrough of the digital twin: connected factories, live operational context, order visibility, and collaboration.",
    steps: [
        {
            id: "step_1",
            route: "/",
            shroud: {
                selector: "[data-scenario~=tour-guide-1]",
                size: 520,
            },
            message: {
                selector: "[data-scenario~=tour-guide-1]",
                offset: { x: 80, y: 40 },
                title: "Factory portfolio at a glance",
                description: (
                    <p>
                        Start from an executive view of every site. Each factory carries its own order timeline, so
                        capacity, schedule risk, and delivery confidence are visible before anyone enters the 3D twin.
                    </p>
                ),
            },
        },
        {
            id: "step_2",
            route: "/",
            shroud: {
                selector: "[data-scenario~=tour-guide-2]",
                size: 260,
            },
            message: {
                selector: "[data-scenario~=tour-guide-2]",
                offset: { x: 80, y: 60 },
                title: "Connected systems, not another silo",
                description: (
                    <p>
                        The twin is fed by business and operational systems already in place. ERP, MES, EAM, and SCADA
                        context come together so decisions are based on one shared operational picture.
                    </p>
                ),
            },
        },
        {
            id: "step_3",
            route: "/phone-factory",
            shroud: {
                selector: "[data-scenario~=tour-guide-3]",
                size: 320,
            },
            message: {
                selector: "[data-scenario~=tour-guide-3]",
                offset: { x: 90, y: 70 },
                title: "Operational health in seconds",
                description: (
                    <p>
                        Key indicators summarize whether the site is efficient, producing quality output, tracking
                        orders, and maintaining assets. Leaders can spot the right conversation without reading a
                        dashboard wall.
                    </p>
                ),
            },
        },
        {
            id: "step_4",
            route: "/phone-factory",
            shroud: {
                selector: "[data-scenario~=tour-guide-4]",
                size: 520,
            },
            message: {
                selector: "[data-scenario~=tour-guide-4]",
                offset: { x: -260, y: -120 },
                title: "Explore the factory virtually",
                description: (
                    <p>
                        Navigate the plant by area, line, and cell directly in the 3D environment. This makes remote
                        reviews, operational briefings, and supplier conversations concrete without waiting for a site
                        visit.
                    </p>
                ),
            },
        },
        {
            id: "step_5",
            route: "/phone-factory",
            shroud: {
                selector: "[data-scenario~=tour-guide-5]",
                size: 620,
            },
            message: {
                selector: "[data-scenario~=tour-guide-5]",
                offset: { x: -180, y: -160 },
                title: "Follow orders and replay decisions",
                description: (
                    <p>
                        Sales orders, manufacturing orders, maintenance windows, and downtime share the same timeline.
                        Replaying the sequence turns operational history into a decision record for customer commitments
                        and continuous improvement.
                    </p>
                ),
            },
        },
        {
            id: "step_6",
            route: "/phone-factory",
            shroud: {
                selector: "[data-scenario~=tour-guide-6]",
                size: 280,
            },
            message: {
                selector: "[data-scenario~=tour-guide-6]",
                offset: { x: -280, y: 70 },
                title: "Bring stakeholders into the same view",
                description: (
                    <p>
                        Invite collaborators into the live twin so operations, maintenance, engineering, and customer
                        teams can align on the same facts instead of trading screenshots and spreadsheets.
                    </p>
                ),
            },
        },
        {
            id: "step_7",
            route: "/phone-factory",
            shroud: {
                selector: "[data-scenario~=tour-guide-7]",
                size: 220,
            },
            message: {
                selector: "[data-scenario~=tour-guide-7]",
                offset: { x: -120, y: -220 },
                title: "Move from tour to business scenarios",
                description: (
                    <p>
                        Use the scenario guide to explore specific value cases: incident response, predictive
                        maintenance, production continuity, and the operational evidence needed to justify investment.
                    </p>
                ),
            },
        },
    ],
};
