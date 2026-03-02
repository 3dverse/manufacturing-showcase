import type { UseCase } from "@/content/type";

export const lorem_ipsum: UseCase = {
    id: "lorem_ipsum",
    name: "Lorem ipsum",
    description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    image: "/assets/useCases/maintenance_incident.png",

    steps: [{ id: "step_1", name: "Step 1", description: "Step 1 description", delayBefore: 1000, incidents: [] }],
};
