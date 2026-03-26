//------------------------------------------------------------------------------
import { useContext, useEffect, useState } from "react";

//------------------------------------------------------------------------------
import type { Client } from "@3dverse/livelink";
import { LivelinkContext, useClients } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
const colorBasedOnUuid = (uuid: string) => {
    const hash = uuid.split("").reduce((acc, char) => {
        return acc + char.charCodeAt(0);
    }, 0);
    return `#${hash.toString(16).padStart(6, "0")}`;
};

//------------------------------------------------------------------------------
export const AvatarList = () => {
    //--------------------------------------------------------------------------
    const { instance } = useContext(LivelinkContext);
    const { clients } = useClients();
    const [watchedClient, setWatchedClient] = useState<Client | null>(null);

    //--------------------------------------------------------------------------
    useEffect(() => {
        if (watchedClient && !clients.includes(watchedClient)) {
            setWatchedClient(null);
        }
    }, [clients, watchedClient]);

    //--------------------------------------------------------------------------
    if (!instance || clients.length === 0) {
        return null;
    }
    //--------------------------------------------------------------------------
    return (
        <div className="flex gap-px rtl:space-x-reverse">
            {clients.map((client) => (
                <button
                    key={client.id}
                    onClick={() => setWatchedClient(client !== watchedClient ? client : null)}
                    className={`
                            w-8 h-8 border-2 rounded-full bg-neutral-200/60 border-transparent
                            ${client === watchedClient ? " border-accent" : "border-transparent"}
                        `}
                    style={{
                        backgroundColor: colorBasedOnUuid(client.id),
                    }}
                ></button>
            ))}
        </div>
    );
};
