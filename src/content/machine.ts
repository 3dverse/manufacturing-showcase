type Machine = {
    id: string;
    name: string;
    description: string;
    image: string;
    technical_documentations: string[];
    technical_plans?: string[];
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
