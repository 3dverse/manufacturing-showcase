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
                title: "Global factory overview",
                description: (
                    <p>
                        Start with a high-level real-time view across all sites. Each factory is connected to its order
                        timeline, giving immediate visibility into capacity, scheduling risk, and delivery confidence
                        before entering a specific digital twin.
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
                        The twin integrates with your existing systems like ERP, MES, EAM, and SCADA. Their data becomes
                        available within the 3D environment, forming a single real-time operational view.
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
                title: "Key operational indicators",
                description: (
                    <p>
                        Track efficiency, quality, order progress, and maintenance status in real-time. These indicators
                        provide a quick view of site performance.
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
                title: "Navigate the 3D environment",
                description: (
                    <p>
                        Move through the factory by area, line, and cell. Access operational data directly in context.
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
                title: "Operational timeline",
                description: (
                    <p>
                        Sales orders, manufacturing orders, maintenance, and downtime are synchronized on a single
                        timeline. Use it to review execution and analyze events over time.
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
                title: "Share with collaborators ",
                description: (
                    <p>
                        Invite team members into the digital twin. All users work from the same shared view across
                        operations, maintenance, and engineering.
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
                        Use predefined scenarios to analyze operations — incident response, maintenance, and production
                        continuity. Each scenario highlights relevant data and context.
                    </p>
                ),
            },
        },
    ],
};
