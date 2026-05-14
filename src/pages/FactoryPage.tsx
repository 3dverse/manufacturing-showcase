import { useContext, useMemo, useState } from "react";

//------------------------------------------------------------------------------
import { Livelink } from "@3dverse/livelink-react";
import { LoadingOverlay } from "@/components/viewer/overlays/LoadingOverlay";

//------------------------------------------------------------------------------
import { TOKEN_3DVERSE } from "@/content/3dverse";
import type { Factory } from "@/content/type";

//------------------------------------------------------------------------------
import { GhettoReconnectContextProvider } from "@/components/contextProviders/GhettoReconnectContextProvider";
import { LivelinkExfilContextProvider } from "@/components/contextProviders/LivelinkExfilContextProvider";
import { GhettoReconnectContext } from "@/contexts/GhettoReconnectContext";

//------------------------------------------------------------------------------
import { DisconnectedOverlay } from "@/components/viewer/overlays/DisconnectedOverlay";
import { FactoryProviders } from "@/components/layout/FactoryProviders";

//------------------------------------------------------------------------------
import { MEDIA_QUERIES, useMediaQuery } from "@/utils/useMediaQuery";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { DesktopLayout } from "@/components/layout/DesktopLayout";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export default function FactoryPage({ factory }: { factory: Factory }) {
    //--------------------------------------------------------------------------
    // Render
    return (
        <GhettoReconnectContextProvider>
            <LivelinkExfilContextProvider>
                <PageContent factory={factory} />
            </LivelinkExfilContextProvider>
        </GhettoReconnectContextProvider>
    );
}

//------------------------------------------------------------------------------
function PageContent({ factory }: { factory: Factory }) {
    //--------------------------------------------------------------------------
    // Contexts
    const { reconnector } = useContext(GhettoReconnectContext);

    //--------------------------------------------------------------------------
    // State
    const [sessionId, setSessionId] = useState<string>();

    //--------------------------------------------------------------------------
    const params = new URLSearchParams(location.search);
    const _sessionId = params.get("sessionId");
    const isMobile = useMediaQuery(MEDIA_QUERIES.MOBILE);

    //--------------------------------------------------------------------------
    if (_sessionId && sessionId !== _sessionId) {
        setSessionId(_sessionId);
    }

    //--------------------------------------------------------------------------
    // Render
    return useMemo(() => {
        return sessionId ? (
            <Livelink
                sessionId={sessionId}
                token={TOKEN_3DVERSE}
                LoadingPanel={LoadingOverlay}
                ConnectionErrorPanel={DisconnectedOverlay}
            >
                <FactoryProviders factory={factory}>{isMobile ? <MobileLayout /> : <DesktopLayout />}</FactoryProviders>
            </Livelink>
        ) : (
            <Livelink
                sceneId={factory.scene_id}
                token={TOKEN_3DVERSE}
                isTransient={reconnector}
                LoadingPanel={LoadingOverlay}
                ConnectionErrorPanel={DisconnectedOverlay}
                autoJoinExisting={false}
            >
                <FactoryProviders factory={factory}>{isMobile ? <MobileLayout /> : <DesktopLayout />}</FactoryProviders>
            </Livelink>
        );
    }, [sessionId, isMobile, factory, reconnector]);
}
