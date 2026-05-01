import { fmtHistoryDate } from "@/components/scadaEvents/modal/format";

//------------------------------------------------------------------------------
type FaultHistoryEntry = { date: Date; description: string; author: string };

//------------------------------------------------------------------------------
type Props = {
    historyEntries: FaultHistoryEntry[];
};

//------------------------------------------------------------------------------
export function ScadaHistorySection({ historyEntries }: Props) {
    return (
        <section className="pb-4">
            {historyEntries.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-muted mb-2">History for this fault</h4>
                    <ul className="flex flex-col gap-3">
                        {historyEntries.map((entry, index) => (
                            <li
                                key={`history-${index}`}
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
