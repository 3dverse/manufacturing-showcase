//------------------------------------------------------------------------------
import { useContext, useEffect, useState } from "react";
import { type Entity } from "@3dverse/livelink";
import { DOMEntity, LivelinkContext } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import { AvatarBadge } from "@/components/clients/AvatarBadge";
import type { Avatar } from "@/content/type";

//------------------------------------------------------------------------------
export const AvatarOverlayItem = ({ avatar }: { avatar: Avatar }) => {
    const { instance } = useContext(LivelinkContext);

    //--------------------------------------------------------------------------
    const [clientCameraEntity, setClientCameraEntity] = useState<Entity | null>(null);

    //--------------------------------------------------------------------------
    useEffect(() => {
        if (!instance) {
            return;
        }

        instance.session
            .getClient({ client_id: avatar.client.id })
            ?.getCameraEntities()
            .then((cameraEntities) => setClientCameraEntity(cameraEntities[0]));
    }, [instance, avatar]);

    //--------------------------------------------------------------------------
    if (!clientCameraEntity) {
        return null;
    }

    return (
        <DOMEntity key={avatar.client.id} scaleFactor={0.025} entity={clientCameraEntity}>
            <AvatarBadge avatar={avatar} />
        </DOMEntity>
    );
};
