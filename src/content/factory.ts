//------------------------------------------------------------------------------
export type Factory = {
    id: string;
    name: string;
    location: string;
    description?: string;
    scene_id: string;
};

//------------------------------------------------------------------------------
export const factories: Factory[] = [
    {
        id: "phone-factory",
        name: "Phone Factory",
        description: "Lorem ipsm dolor sit amet consectetur adipisicing elit.",
        location: "Paris, France",
        scene_id: "3e23233c-0c97-43d7-ab5e-9eb8caa2f42b",
    },
    {
        id: "y-factory",
        name: "Y Factory",
        description: "Lorem ipsm dolor sit amet consectetur adipisicing elit.",
        location: "Tokyo, Japan",
        scene_id: "3e23233c-0c97-43d7-ab5e-9eb8caa2f42b",
    },
];
