export const ProgressBar = ({
    progress,
    leftMarker,
    rightMarker,
    elapsedTime,
}: {
    progress: number;
    leftMarker: string;
    rightMarker: string;
    elapsedTime: string;
}) => {
    return (
        <div className="relative mx-2 border-x border-l-accent border-r-accent-200">
            <span className="absolute top-1/2 -left-2 -translate-y-1/2 w-[calc(100%+14px)] h-px bg-accent-200 -z-10" />
            <div className="w-full h-5 bg-accent-100/40">
                <div
                    className="w-full h-full bg-accent-500 rounded-r-lg origin-left"
                    style={{ scale: `${progress} 1` }}
                />
            </div>
            {elapsedTime && <div className="absolute top-0 px-2 py-[2px] text-2xs text-slate-0">{elapsedTime}</div>}

            <div className="w-full h-full flex items-center justify-between px-1 pt-2 text-2xs leading-3 text-muted/80">
                <p className="text-accent">{leftMarker}</p>
                <p>{rightMarker}</p>
            </div>
        </div>
    );
};
