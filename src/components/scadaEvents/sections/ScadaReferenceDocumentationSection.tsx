import type { VideoPresentation } from "@/components/scadaEvents/modal/format";
import { fmtHistoryDate } from "@/components/scadaEvents/modal/format";

//------------------------------------------------------------------------------
type FaultHistoryEntry = { date: Date; description: string; author: string };

//------------------------------------------------------------------------------
type Props = {
    reasonCode: string;
    videoPresentation: VideoPresentation | null;
    historyEntries: FaultHistoryEntry[];
};

//------------------------------------------------------------------------------
export function ScadaReferenceDocumentationSection({
    reasonCode,
    videoPresentation,
    historyEntries,
}: Props) {
    return (
        <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
                Reference — {reasonCode}
            </h3>
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
            {historyEntries.length > 0 && (
                <div className="mt-4">
                    <h4 className="text-xs font-semibold text-muted mb-2">History for this fault</h4>
                    <ul className="flex flex-col gap-3">
                        {historyEntries.map((entry, index) => (
                            <li
                                key={`${reasonCode}-history-${index}`}
                                className="rounded-md border border-slate-200/70 bg-slate-50/80 px-3 py-2"
                            >
                                <p className="text-[11px] text-muted">
                                    {fmtHistoryDate(entry.date)} · {entry.author}
                                </p>
                                <p className="text-xs text-slate-800 mt-1">{entry.description}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
}
