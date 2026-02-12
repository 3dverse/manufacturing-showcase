import type { UseCase } from "@/content/type";

export const maintenance_incident: UseCase = {
    id: "maintenance_incident",
    name: "Maintenaince incident",
    description: "Vibration anormale du moteur",

    steps: [
        {
            id: "step_1",
            name: "Step 1",
            description: "Step 1 description",
            delayBefore: 1000, // ms
            incidents: [
                {
                    type: "warning",
                    description: "Déséquilibre, roulement défectueux, fixation desserrée ",
                    machines: [{ station: "labelling_station", machines: ["machine_1"] }],
                    possibleCauses: ["Déséquilibre, roulement défectueux, fixation desserrée."],
                    consequences: ["Usure accélérée, risque de panne."],
                    actions: [
                        {
                            id: "alert_operator",
                        },
                    ],
                },
            ],
        },
    ],
};
