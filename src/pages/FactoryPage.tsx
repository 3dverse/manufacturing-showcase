import { useContext } from "react";

//------------------------------------------------------------------------------
import { Livelink } from "@3dverse/livelink-react";
import { LoadingOverlay } from "@/components/viewer/overlays/LoadingOverlay";
import { DisconnectedOverlay } from "@/components/viewer/overlays/DisconnectedOverlay";

//------------------------------------------------------------------------------
import { TOKEN_3DVERSE } from "@/content/3dverse";
import type { Factory } from "@/content/type";
import { FactoryProviders } from "@/components/layout/FactoryProviders";
import { LivelinkExfilContextProvider } from "@/components/contextProviders/LivelinkExfilContextProvider";
import FactoryLayout from "@/components/layout/FactoryLayout";
import { GhettoReconnectContext } from "@/contexts/GhettoReconnectContext";
import { GhettoReconnectContextProvider } from "@/components/contextProviders/GhettoReconnectContextProvider";

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
    // Render
    return (
        <Livelink
            sceneId={factory.scene_id}
            token={TOKEN_3DVERSE}
            isTransient={reconnector}
            LoadingPanel={LoadingOverlay}
            ConnectionErrorPanel={DisconnectedOverlay}
        >
            <FactoryProviders factory={factory}>
                <FactoryLayout />
            </FactoryProviders>
        </Livelink>
    );
}
