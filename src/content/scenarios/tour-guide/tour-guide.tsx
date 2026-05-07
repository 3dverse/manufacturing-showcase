import type { ScenarioDefinition } from "../types";

export const tourGuide: ScenarioDefinition = {
    id: "tour_guide",
    title: "Guided Mode",
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
                title: "Factory Overview",
                description: (
                    <p>
                        OEE, open work orders, and schedule risk per site - pulled directly from your systems. Use this
                        view to identify which factory needs attention and why before you go inside. A site running at
                        74% OEE with three delayed orders tells a different story than one at 94%.
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
                title: "Connected Systems",
                description: (
                    <p>
                        Production, maintenance, machine, and order data flow directly into the environment from
                        existing enterprise and operational systems. When an order changes, a robot stops, or a downtime
                        event occurs, the operational state is reflected immediately without manual updates or
                        duplicated workflows.
                    </p>
                ),
            },
        },
        {
            id: "step_3",
            route: "/tokyo-phone-factory",
            shroud: {
                selector: "[data-scenario~=tour-guide-3]",
                size: 320,
            },
            message: {
                selector: "[data-scenario~=tour-guide-3]",
                offset: { x: 90, y: 70 },
                title: "Stable or investigate?",
                description: (
                    <p>
                        Key indicators answer that question the moment you enter a site. If one indicator is off, you
                        already know where to look before navigating anywhere on the floor.
                    </p>
                ),
            },
        },
        {
            id: "step_4",
            // TODO: make it work
            route: "/tokyo-phone-factory/8c97d140",
            shroud: {
                selector: "[data-scenario~=tour-guide-4]",
                size: 820,
            },
            message: {
                selector: "[data-scenario~=tour-guide-4]",
                offset: { x: -460, y: -320 },
                title: "Factory Floor",
                description: (
                    <p>
                        Navigate by area, line, or cell to review active orders, machine status, and issues directly in
                        context. Robot and machine states remain synchronized with the operational environment in real
                        time, allowing teams to understand floor conditions remotely without waiting for site
                        walkthroughs or operator updates.
                    </p>
                ),
            },
        },
        {
            id: "step_5",
            route: "/tokyo-phone-factory",
            shroud: {
                selector: "[data-scenario~=tour-guide-5]",
                size: 620,
            },
            message: {
                selector: "[data-scenario~=tour-guide-5]",
                offset: { x: -180, y: -320 },
                title: "Operational Timeline",
                description: (
                    <p>
                        Trace events over time. Scroll through the timeline & click on any event to review the
                        operational sequence, linked records, and impact. Teams can quickly understand what changed
                        without waiting for manual investigation or disconnected reporting.
                    </p>
                ),
            },
        },
        {
            id: "step_6",
            route: "/tokyo-phone-factory",
            shroud: {
                selector: "[data-scenario~=tour-guide-6]",
                size: 280,
            },
            message: {
                selector: "[data-scenario~=tour-guide-6]",
                offset: { x: -280, y: 70 },
                title: "Shared operational review",
                description: (
                    <p>
                        Access production operations remotely from a mobile device, tablet, or desktop. Operational
                        teams can validate production impact, monitor escalations, and coordinate maintenance or
                        production decisions using the same synchronized operational state across sites.
                    </p>
                ),
            },
        },
        {
            id: "step_7",
            route: "/tokyo-phone-factory",
            shroud: {
                selector: "[data-scenario~=tour-guide-7]",
                size: 220,
            },
            message: {
                selector: "[data-scenario~=tour-guide-7]",
                offset: { x: -120, y: -220 },
                title: "Explore operational scenarios",
                description: (
                    <p>
                        The guided tour showed the environment. The scenarios show how it's used. Choose incident
                        simulation to walk through a real operational situation; the data, the decisions, and the
                        outcome.
                    </p>
                ),
            },
        },
    ],
};
