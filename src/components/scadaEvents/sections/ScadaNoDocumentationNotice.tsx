//------------------------------------------------------------------------------
type Props = {
    reasonCode: string;
};

//------------------------------------------------------------------------------
export function ScadaNoDocumentationNotice({ reasonCode }: Props) {
    return (
        <p className="text-xs text-muted border border-dashed border-slate-200/80 rounded-md px-3 py-2">
            No machine documentation (video or fault history) on file for fault code{" "}
            <span className="font-mono text-slate-700">{reasonCode}</span>.
        </p>
    );
}
