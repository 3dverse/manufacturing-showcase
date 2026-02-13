export type Factory = { id: string; name: string; location: string; description?: string; scene_id: string };

export const factories: Factory[] = [
    {
        id: "x-factory",
        name: "X Factory",
        description: "Lorem ipsm dolor sit amet consectetur adipisicing elit.",
        location: "Paris, France",
        scene_id: "e8c78e6b-0448-4cfc-90c9-e963747f6635",
    },
    {
        id: "y-factory",
        name: "Y Factory",
        description: "Lorem ipsm dolor sit amet consectetur adipisicing elit.",
        location: "Tokyo, Japan",
        scene_id: "6404b505-119c-448d-82d6-ce5f8597421c",
    },
];
