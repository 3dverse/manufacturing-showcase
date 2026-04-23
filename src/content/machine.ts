type Machine = {
    id: string;
    name: string;
    description: string;
    image: string;
    technical_documentations: string[];
    technical_plans?: string[];
    technical_details?: {
        label: string;
        value: string;
    }[];
};

//------------------------------------------------------------------------------
export const machinesDocumentation: Machine[] = [
    {
        id: "fanuc",
        name: "Fanuc M-950iA/500",
        description: "High-performance multi-function machine tool that combines precision and efficiency.",
        image: "/assets/machine/Fanuc_M-950iA-500.webp",
        technical_documentations: [
            "https://d16ohktstcjvly.cloudfront.net/asset/513891251684/document_akc6cfjjbp6h38pb9824982v3p",
        ],
        technical_plans: ["https://openjicareport.jica.go.jp/pdf/11847464_03.pdf"],
    },
    {
        id: "omron",
        name: "Omron HD-1500",
        description:
            "The 1,500 Kg payload Omron HD-1500 mobile robot handles the performance of simple transport, delivery, and routing operations so your employees can perform higher-value jobs.",
        image: "/assets/machine/Omron_NS-500.webp",
        technical_documentations: ["https://www.mmci-automation.com/omron-hd-1500-series-amr.html"],
        technical_details: [
            {
                label: "Laser Type",
                value: "OMRON OS32C",
            },
            {
                label: "Max Payload",
                value: "500kg/3307lbs",
            },
            {
                label: "Max Speed",
                value: "1.8m/s",
            },
            {
                label: "Rear Sensing",
                value: "Optical",
            },
        ],
    },
    {
        id: "sekiguchi-press",
        name: "Sekiguchi SSD1000-DSF",
        description: "Automatic Press with Double Linear Feed System",
        image: "",
        technical_documentations: ["https://www.sekiguchi-mfg.co.jp/en/press_machine/ssd1000-dsf/"],
    },
    {
        id: "yantra-design-drilling",
        name: "Yantra Design CNC Drilling",
        description: "AManufacturer & Exporter of CNC Drilling Machine",
        image: "",
        technical_documentations: ["https://yantradesign.co.in/cnc-drilling-machine.php"],
    },
];

//------------------------------------------------------------------------------
export function getMachineDocumentation(machineName: string): Machine {
    const doc = machinesDocumentation.find((m) => m.id.toLowerCase() === machineName.toLowerCase());
    return doc || machinesDocumentation[0];
}
