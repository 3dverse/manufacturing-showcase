//------------------------------------------------------------------------------
import { useContext, useEffect, useState, useCallback } from "react";
import { faXmark, faExpand } from "@fortawesome/pro-light-svg-icons";
import { uniqueNamesGenerator, adjectives, colors, animals } from "unique-names-generator";
import createColor from "create-color";

//------------------------------------------------------------------------------
import type { Entity, Client as LivelinkClient } from "@3dverse/livelink";
import { LivelinkContext, useClients, Canvas as LivelinkCanvas, Viewport } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import { AvatarBadge } from "@/components/clients/AvatarBadge";
import Button from "@/components/common/Button";
import { Icon } from "@/components/common/Icon";

//------------------------------------------------------------------------------
import { useAvatarsStore } from "@/store/useAvatarsStore";
import type { Avatar } from "@/content/type";
import { ViewerPanel } from "../common/ViewerPanel";
import { LivelinkExfilContext } from "@/contexts/LivelinkExfilContext";

//------------------------------------------------------------------------------
export const AvatarList = () => {
    //--------------------------------------------------------------------------
    const { instance } = useContext(LivelinkContext);
    const { viewportRef } = useContext(LivelinkExfilContext);
    const { clients } = useClients();
    const {
        avatars,
        setAvatars,
        watchedAvatar,
        setWatchedAvatar,
        fullScreenWatchedAvatar,
        setFullScreenWatchedAvatar,
    } = useAvatarsStore();

    //--------------------------------------------------------------------------
    const [mainCamera, setMainCamera] = useState<Entity | null>(null);
    const toggleMiniViewport = useCallback(() => {
        if (fullScreenWatchedAvatar) {
            setFullScreenWatchedAvatar(false);
            setMainCamera(null);
        } else {
            setFullScreenWatchedAvatar(true);
            setMainCamera(viewportRef.current?.camera_projection?.camera_entity || null);
        }
    }, [fullScreenWatchedAvatar, setFullScreenWatchedAvatar, viewportRef]);

    //--------------------------------------------------------------------------
    const generateAvatar = (client: LivelinkClient): Avatar => {
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
        if (watchedAvatar && !clients.includes(watchedAvatar.client)) {
            setWatchedAvatar(null);
        }
    }, [clients, watchedAvatar, setWatchedAvatar]);

    //--------------------------------------------------------------------------
    useEffect(() => {
        setAvatars(clients.map((client) => generateAvatar(client)));
    }, [clients, setAvatars]);

    //--------------------------------------------------------------------------
    if (!instance || clients.length === 0) {
        return null;
    }

    //--------------------------------------------------------------------------
    //@ts-expect-error - ione of both is always defined, but the typings don't allow it
    const viewportProps: { cameraEntity: Entity } | { client: LivelinkClient } = fullScreenWatchedAvatar
        ? { cameraEntity: mainCamera || null }
        : { client: watchedAvatar?.client };
    return (
        <>
            <div className="flex gap-px rtl:space-x-reverse">
                {avatars.map((avatar) => (
                    <AvatarBadge key={avatar.client.id} avatar={avatar} />
                ))}
            </div>
            {watchedAvatar && (
                <ViewerPanel
                    className={
                        "fixed z-40 left-2 top-40 lg:top-14 lg:right-2 lg:left-auto w-40 lg:w-72 flex flex-col-reverse gap-px bg-white/90 shadow-2xl border border-slate-200 animate-appear-left"
                    }
                    style={
                        {
                            "--client-color": fullScreenWatchedAvatar ? "var(--color-accent)" : watchedAvatar.color,
                        } as React.CSSProperties
                    }
                    data-theme="light"
                >
                    <div
                        className="relative w-full aspect-video flex items-center justify-center border"
                        style={{
                            borderColor: "var(--client-color)",
                            backgroundColor: "color-mix(in srgb, var(--client-color) 20%, transparent)",
                        }}
                    >
                        <LivelinkCanvas className="w-full h-full bg-transparent">
                            <Viewport {...viewportProps} className="w-full h-full">
                                <div
                                    className="absolute bottom-0 left-0 w-full px-3 py-1 text-xs sm:text-sm font-medium"
                                    style={{
                                        color: "var(--client-color)",
                                        backgroundColor: "color-mix(in srgb, var(--client-color) 40%, white)",
                                    }}
                                >
                                    {fullScreenWatchedAvatar ? (
                                        "Back to you"
                                    ) : (
                                        <span className="capitalize">{watchedAvatar.name}</span>
                                    )}
                                </div>

                                {
                                    <Button
                                        variant="ghost"
                                        size="md"
                                        className="absolute top-0 left-0 pb-4 items-center justify-center mx-auto w-full h-full opacity-0 hover:opacity-100 hover:bg-transparent"
                                        onClick={() => toggleMiniViewport()}
                                    >
                                        {fullScreenWatchedAvatar ? (
                                            <> </>
                                        ) : (
                                            <Icon
                                                icon={faExpand}
                                                size="lg"
                                                className="bg-accent-300 p-2 rounded-2xl text-white"
                                            />
                                        )}
                                    </Button>
                                }
                                {!fullScreenWatchedAvatar && (
                                    <Button
                                        variant="primary"
                                        size="2xs"
                                        className="absolute top-1 right-1 flex items-center justify-center rounded-full p-1 hover:bg-accent-300"
                                        onClick={() => setWatchedAvatar(null)}
                                    >
                                        <Icon icon={faXmark} />
                                    </Button>
                                )}
                            </Viewport>
                        </LivelinkCanvas>
                    </div>
                </ViewerPanel>
            )}
        </>
    );
};
