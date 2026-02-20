export type Factory = { id: string; name: string; location: string; description?: string; scene_id: string };

export const factories: Factory[] = [
    {
        id: "x-factory",
        name: "X Factory",
        description: "Lorem ipsm dolor sit amet consectetur adipisicing elit.",
        location: "Paris, France",
        scene_id: "a4213021-3fee-4348-9c6d-8ebf8cd84842",
    },
    {
        id: "y-factory",
        name: "Y Factory",
        description: "Lorem ipsm dolor sit amet consectetur adipisicing elit.",
        location: "Tokyo, Japan",
        scene_id: "a4213021-3fee-4348-9c6d-8ebf8cd84842",
    },
];
