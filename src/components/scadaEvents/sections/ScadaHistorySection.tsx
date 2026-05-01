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
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">History</h3>
                    <ul className="flex flex-col">
                        {historyEntries.map((entry, index) => (
                            <li
                                key={`history-${index}`}
                                className="first:rounded-t-md last:rounded-b-md border-x border-t last:border-b border-slate-200/70 bg-slate-50/80 px-3 py-2"
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
