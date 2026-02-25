//------------------------------------------------------------------------------
export type Factory = {
    id: string;
    name: string;
    location: string;
    description?: string;
    scene_id: string;
    area_categories_sort?: string[];
};

//------------------------------------------------------------------------------
export const factories: Factory[] = [
    {
        id: "x-factory",
        name: "X Factory",
        description: "Lorem ipsm dolor sit amet consectetur adipisicing elit.",
        location: "Paris, France",
        scene_id: "3e23233c-0c97-43d7-ab5e-9eb8caa2f42b",
        area_categories_sort: ["reception", "storage", "production", "control"],
    },
    {
        id: "y-factory",
        name: "Y Factory",
        description: "Lorem ipsm dolor sit amet consectetur adipisicing elit.",
        location: "Tokyo, Japan",
        scene_id: "3e23233c-0c97-43d7-ab5e-9eb8caa2f42b",
        area_categories_sort: ["reception", "storage", "production", "control"],
    },
];
