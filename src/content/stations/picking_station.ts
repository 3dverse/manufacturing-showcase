import { StationId } from "./enum";
import type { Station } from "./type";

//------------------------------------------------------------------------------
export const pickingStation: Station = {
    id: StationId.PICKING_STATION,
    name: "Picking Station",
    description: "...",
    technical_documentations: ["https://openjicareport.jica.go.jp/pdf/11847464_03.pdf"],
    technical_plans: [".pdf"],
    modules: [
        {
            id: "Kawasaki-HK-1250",
            name: "Module Kawasaki HK-1250",
            description: "...",
            technical_documentations: ["https://openjicareport.jica.go.jp/pdf/11847464_03.pdf"],
            technical_plans: ["https://openjicareport.jica.go.jp/pdf/11847464_03.pdf"],
            states: [
                {
                    timestamp: 1717756800,
                    active: true,
                    coordinates: {
                        x: 0,
                        y: 0,
                        z: 0,
                    },
                    course: 100, // mm
                    units_picked: 100,
                    picked_rate: 90,
                    incidents: 10,
                    quality_of_grip: 90,
                },
            ],
            pieces: [
                {
                    id: "motor_axix_x",
                    name: "Motor axis X",
                    type: "motor",
                    states: [
                        {
                            timestamp: 1717756800,
                            temperature: {
                                value: 20,
                                unit: "°C",
                                warning_threshold: 50,
                                critical_threshold: 100,
                            },
                            coupling: "direct",
                            intensity: { value: 100, unit: "A" },
                            power: { value: 1000, unit: "W" },
                        },
                    ],
                },
            ],
        },
    ],
};
