//------------------------------------------------------------------------------
import Button from "@/components/common/Button";

//------------------------------------------------------------------------------
import type { Avatar } from "@/content/type";
import { useAvatarsStore } from "@/store/useAvatarsStore";

//------------------------------------------------------------------------------
export const AvatarBadge = ({ avatar }: { avatar: Avatar }) => {
    //--------------------------------------------------------------------------
    const { watchedAvatar, setWatchedAvatar } = useAvatarsStore();

    //--------------------------------------------------------------------------
    return (
        <Button
            key={avatar.client.id}
            onClick={() => setWatchedAvatar(avatar.client !== watchedAvatar?.client ? avatar : null)}
            className={`
        w-8 h-8 border-2 rounded-full bg-neutral-200/60 border-transparent
        ${avatar.client === watchedAvatar?.client ? " border-accent" : "border-transparent"}
        flex items-center justify-center font-bold text-xs select-none
      `}
            style={{
                backgroundColor: avatar.color,
                color: avatar.textColor,
            }}
            title={avatar.name}
        >
            {avatar.initials}
        </Button>
    );
};
