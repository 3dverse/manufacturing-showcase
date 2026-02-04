//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";

//------------------------------------------------------------------------------
const avatars = [
    {
        id: 1,
        name: "John Doe",
        color: "#841084",
    },
    {
        id: 2,
        name: "Abby Doe",
        color: "#0b660b",
    },
    {
        id: 3,
        name: "Roger Smith",
        color: "#0000FF",
    },
];

//------------------------------------------------------------------------------
const ClientAvatarList = () => {
    //--------------------------------------------------------------------------
    return (
        <ViewerPanel className="flex gap-1 pointer-events-auto h-fit p-1 pr-3 bg-neutral-200/60 border-muted rounded-full backdrop-blur-xl shadow-2xl">
            {avatars.map((avatar) => (
                <div
                    key={avatar.id}
                    className="flex items-center justify-center w-7 h-7 -mr-2 border border-(--color)/20 rounded-full bg-[color-mix(in_srgb,var(--color)_30%,var(--color-ground))] text-(--color) text-2xs font-medium hover:z-10 hover:border-(--color)/60 transition-all duration-200 cursor-pointer"
                    style={{ "--color": avatar.color } as React.CSSProperties}
                >
                    {avatar.name.slice(0, 1)}
                </div>
            ))}
        </ViewerPanel>
    );
};

export default ClientAvatarList;
