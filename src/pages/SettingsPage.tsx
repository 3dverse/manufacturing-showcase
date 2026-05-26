//------------------------------------------------------------------------------
import { useCallback } from "react";

//------------------------------------------------------------------------------
import Button from "@/components/common/Button";
import { useNavigationStore } from "@/store/useNavigationStore";
import { LOCAL_STORAGE_KEYS, useLocalStorage } from "@/hooks/useLocalStorage";

//------------------------------------------------------------------------------
const SCALE_PRESETS: { label: string; value: number | undefined }[] = [
    { label: "Auto (default)", value: undefined },
    { label: "1× (native)", value: 1 },
    { label: "1.5×", value: 1.5 },
    { label: "2×", value: 2 },
    { label: "3×", value: 3 },
];

//------------------------------------------------------------------------------
const SettingsPage = () => {
    //--------------------------------------------------------------------------
    const { navigate } = useNavigationStore();
    const [scale, setScale] = useLocalStorage<number | undefined>(LOCAL_STORAGE_KEYS.VIEWER_SCALE, undefined);

    //--------------------------------------------------------------------------
    const homeHandler = useCallback(() => {
        navigate("/");
    }, [navigate]);

    //--------------------------------------------------------------------------
    const handleScaleChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const raw = event.target.value;
            if (raw === "") {
                setScale(undefined);
                return;
            }
            const parsed = Number(raw);
            if (Number.isFinite(parsed) && parsed > 0) {
                setScale(parsed);
            }
        },
        [setScale],
    );

    //--------------------------------------------------------------------------
    return (
        <div className="absolute inset-0 overflow-auto bg-ground">
            <div className="mx-auto max-w-2xl">
                <div className="mb-6 p-8 flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-default">Settings</h1>
                        <p className="text-sm text-subtle mt-1">
                            Local viewer preferences — stored in your browser only.
                        </p>
                    </div>
                    <Button onClick={homeHandler} variant="ghost" size="sm">
                        Back
                    </Button>
                </div>

                <div className="px-8 space-y-6">
                    <section className="space-y-3">
                        <div>
                            <h2 className="text-base font-semibold text-default">Viewer scale</h2>
                            <p className="text-xs text-subtle mt-1">
                                Render resolution multiplier passed to the Canvas. Higher values produce a sharper image
                                at the cost of GPU performance. Leave empty for auto.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                value={scale ?? ""}
                                onChange={handleScaleChange}
                                placeholder="auto"
                                className="w-32 px-3 py-2 rounded-sm border border-default bg-foreground text-default text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                            />
                            <span className="text-xs text-muted">
                                Current: {scale === undefined ? "auto" : `${scale}×`}
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {SCALE_PRESETS.map((preset) => {
                                const isActive = scale === preset.value;
                                return (
                                    <Button
                                        key={preset.label}
                                        size="xs"
                                        variant={isActive ? "plain" : "outline"}
                                        colorScheme="accent"
                                        onClick={() => setScale(preset.value)}
                                    >
                                        {preset.label}
                                    </Button>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
