//------------------------------------------------------------------------------
import { useContext, useEffect } from "react";
import { uniqueNamesGenerator, adjectives, colors, animals } from "unique-names-generator";
import createColor from "create-color";

//------------------------------------------------------------------------------
import type { Client } from "@3dverse/livelink";
import { LivelinkContext, useClients } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import { AvatarBadge } from "@/components/clients/AvatarBadge";

//------------------------------------------------------------------------------
import { useAvatarsStore } from "@/store/useAvatarsStore";
import type { Avatar } from "@/content/type";

//------------------------------------------------------------------------------
export const AvatarList = () => {
    //--------------------------------------------------------------------------
    const { instance } = useContext(LivelinkContext);
    const { clients } = useClients();
    const { avatars, setAvatars, watchedClient, setWatchedClient } = useAvatarsStore();

    //--------------------------------------------------------------------------
    const generateAvatar = (client: Client): Avatar => {
        const name = uniqueNamesGenerator({
            dictionaries: [adjectives, colors, animals],
            seed: client.id,
            length: 2,
        });

        // Extract initials: first letter of first and last word, uppercase
        const words = name.split(" ");
        let initials = "";
        if (words.length === 1) {
            initials = words[0].slice(0, 2).toUpperCase();
        } else {
            initials = (words[0][0] + words[words.length - 1][0]).toUpperCase();
        }

        function getContrastTextColor(bgColor: string): string {
            // Remove '#' if present
            const color = bgColor.replace("#", "");
            const r = parseInt(color.substring(0, 2), 16);
            const g = parseInt(color.substring(2, 4), 16);
            const b = parseInt(color.substring(4, 6), 16);
            // Calculate luminance
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            return luminance > 0.5 ? "#222" : "#fff";
        }
        const color = createColor(client.id);
        const textColor = getContrastTextColor(color);

        return {
            client,
            name,
            color,
            textColor,
            initials,
        };
    };

    //--------------------------------------------------------------------------
    useEffect(() => {
        if (watchedClient && !clients.includes(watchedClient)) {
            setWatchedClient(null);
        }
    }, [clients, watchedClient, setWatchedClient]);

    //--------------------------------------------------------------------------
    useEffect(() => {
        setAvatars(clients.map((client) => generateAvatar(client)));
    }, [clients, setAvatars]);

    //--------------------------------------------------------------------------
    if (!instance || clients.length === 0) {
        return null;
    }
    //--------------------------------------------------------------------------
    return (
        <div className="flex gap-px rtl:space-x-reverse">
            {avatars.map((avatar) => (
                <AvatarBadge key={avatar.client.id} avatar={avatar} />
            ))}
        </div>
    );
};
