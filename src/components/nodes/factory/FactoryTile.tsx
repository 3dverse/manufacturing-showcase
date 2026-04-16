//------------------------------------------------------------------------------
import { CameraController, Canvas, Livelink, useCameraEntity, Viewport } from "@3dverse/livelink-react";
import { LoadingOverlay } from "@3dverse/livelink-react-ui";

//------------------------------------------------------------------------------
import { Triangle } from "@/components/common/icons/Triangle";

//------------------------------------------------------------------------------
import type { Factory } from "@/content/type";
import { TOKEN_3DVERSE } from "@/content/3dverse";

//------------------------------------------------------------------------------
export const FactoryTile = ({ factoryItem }: { factoryItem: Factory }) => {
    //--------------------------------------------------------------------------
    return (
        <a
            href={`/${factoryItem.slug}`}
            className="relative w-full h-full text-left bg-slate-50 rounded-3xl shadow-2xl hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
        >
            <div className="flex">
                <div className="grow pl-7 pr-5 pt-5 pb-4">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <h2 className="text-3xl font-semibold mb-1 group-hover:text-accent transition-colors">
                                {factoryItem.name}
                            </h2>
                            <div className="flex items-center text-sm text-accent">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                                <span className="text-sm">{factoryItem.location}</span>
                            </div>
                        </div>
                    </div>
                    {factoryItem.description && (
                        <p className="text-sm text-subtle/80 mb-4">{factoryItem.description}</p>
                    )}
                </div>
                <div className="flex flex-col text-left px-6 py-3 border-l border-slate-100">
                    <p className="text-3xl font-semibold text-positive-800">
                        97<span className="text-sm opacity-60">%</span>
                    </p>
                    <p>
                        OEE <Triangle />
                    </p>
                </div>
            </div>

            <Livelink sceneId={factoryItem.scene_id} token={TOKEN_3DVERSE} LoadingPanel={LoadingOverlay}>
                <Preview />
            </Livelink>

            {/* Livelink preview */}
            <div className="w-full h-full p-4 bg-stripes rounded-lg border-t border-slate-100" />

            {/* Bottom accent line */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left z-10" />
        </a>
    );
};

//------------------------------------------------------------------------------
const Preview = () => {
    const { cameraEntity } = useCameraEntity();
    return (
        <Canvas className="w-full h-full">
            <Viewport cameraEntity={cameraEntity} className="w-full h-full">
                <CameraController />
            </Viewport>
        </Canvas>
    );
};
