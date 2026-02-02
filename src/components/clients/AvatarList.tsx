//------------------------------------------------------------------------------
const avatars = [
    {
        id: 1,
        name: "John Doe",
        color: "#FF0000",
    },
    {
        id: 2,
        name: "Abby Doe",
        color: "#00FF00",
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
        <div className="flex gap-1 pointer-events-auto h-fit bg-accent-200/30 rounded-full p-1 pr-4 backdrop-blur-xl shadow-2xl">
            {avatars.map((avatar) => (
                <div
                    key={avatar.id}
                    className="flex items-center justify-center w-8 h-8 -mr-3 border border-(--color)/20 rounded-full bg-[color-mix(in_srgb,var(--color)_30%,var(--color-ground))] text-(--color) text-2xs font-medium hover:z-10 hover:border-(--color)/60 transition-all duration-200 cursor-pointer"
                    style={{ "--color": avatar.color } as React.CSSProperties}
                >
                    {avatar.name.slice(0, 1)}
                </div>
            ))}
        </div>
    );
};

export default ClientAvatarList;
