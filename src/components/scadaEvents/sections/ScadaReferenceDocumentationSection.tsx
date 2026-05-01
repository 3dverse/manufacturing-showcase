import type { VideoPresentation } from "@/components/scadaEvents/modal/format";

//------------------------------------------------------------------------------
type Props = {
    reasonCode: string;
    videoPresentation: VideoPresentation | null;
};

//------------------------------------------------------------------------------
export function ScadaReferenceDocumentationSection({ reasonCode, videoPresentation }: Props) {
    return (
        <section className="pb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Video solution</h3>
            {videoPresentation &&
                (videoPresentation.kind === "youtube" ? (
                    <div className="aspect-video w-full overflow-hidden rounded-md bg-slate-900">
                        <iframe
                            title={`Reference video for ${reasonCode}`}
                            src={videoPresentation.embedUrl}
                            className="size-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                ) : videoPresentation.kind === "direct" ? (
                    <div className="aspect-video w-full overflow-hidden rounded-md bg-slate-900">
                        <video src={videoPresentation.src} controls className="size-full object-contain" />
                    </div>
                ) : (
                    <a
                        href={videoPresentation.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-600 underline underline-offset-2"
                    >
                        Open reference video
                    </a>
                ))}
        </section>
    );
}
