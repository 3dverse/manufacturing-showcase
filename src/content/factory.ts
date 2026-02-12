export type Factory = { id: string; name: string; location: string; description?: string; scene_id: string };

export const factories: Factory[] = [
    {
        id: "x-factory",
        name: "X Factory",
        description: "Lorem ipsm dolor sit amet consectetur adipisicing elit.",
        location: "Paris, France",
        scene_id: "d490dde6-5590-426f-a0ff-7a422b3e2ba7",
    },
    {
        id: "y-factory",

        name: "Y Factory",
        description: "Lorem ipsm dolor sit amet consectetur adipisicing elit.",
        location: "Tokyo, Japan",
        scene_id: "d490dde6-5590-426f-a0ff-7a422b3e2ba7",
    },
];
