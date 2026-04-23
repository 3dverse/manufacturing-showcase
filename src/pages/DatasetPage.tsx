import { useState, useEffect, useContext, useCallback } from "react";

//------------------------------------------------------------------------------
import Button from "@/components/common/Button";
import { FactoriesContext } from "@/contexts/FactoriesContext";
import { useNavigate } from "@/hooks/useNavigate";
import type { Factory } from "@/content/type";

//------------------------------------------------------------------------------
const API = "/-/api/dataset";

//------------------------------------------------------------------------------
type DatasetMeta = {
    sceneId: string;
    siteId: string;
    now: number;
};

type RegenerateResult = {
    regenerated: DatasetMeta[];
    errors: { sceneId: string; message: string }[];
};

//------------------------------------------------------------------------------
function formatDate(unix: number) {
    return new Date(unix * 1000).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

function truncate(str: string, n = 8) {
    return str.length > n ? str.slice(0, n) + "…" : str;
}

//------------------------------------------------------------------------------
type SiteStatus = "idle" | "loading" | "done" | "error";

//------------------------------------------------------------------------------
export default function DatasetPage() {
    const navigate = useNavigate();
    const { factories } = useContext(FactoriesContext);

    //--------------------------------------------------------------------------
    const [datasetsBySite, setDatasetsBySite] = useState<Map<string, DatasetMeta>>(new Map());
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const [siteStatuses, setSiteStatuses] = useState<Record<string, SiteStatus>>({});
    const [siteErrors, setSiteErrors] = useState<Record<string, string>>({});
    const [regeneratingAll, setRegeneratingAll] = useState(false);
    const [lastResult, setLastResult] = useState<RegenerateResult | null>(null);

    //--------------------------------------------------------------------------
    const fetchSites = useCallback(async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const resp = await fetch(`${API}/`);
            const data = await resp.json();
            const sites: DatasetMeta[] = data.sites ?? [];
            setDatasetsBySite(new Map(sites.map((s) => [s.sceneId, s])));
            /* tslint:disable-next-line */
            /* eslint-disable  @typescript-eslint/no-explicit-any */
        } catch (err: any) {
            setFetchError((err?.message as string) ?? "Failed to fetch datasets");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSites();
    }, [fetchSites]);

    //--------------------------------------------------------------------------
    const applyRegenerated = (regenerated: DatasetMeta[]) => {
        setDatasetsBySite((prev) => {
            const next = new Map(prev);
            for (const meta of regenerated) next.set(meta.sceneId, meta);
            return next;
        });
    };

    //--------------------------------------------------------------------------
    const regenerateSite = async (sceneId: string) => {
        setSiteStatuses((s) => ({ ...s, [sceneId]: "loading" }));
        setSiteErrors((e) => {
            const n = { ...e };
            delete n[sceneId];
            return n;
        });
        try {
            const resp = await fetch(`${API}/regenerate?siteId=${sceneId}`, { method: "POST" });
            const result: RegenerateResult = await resp.json();
            if (result.errors.length > 0) {
                setSiteStatuses((s) => ({ ...s, [sceneId]: "error" }));
                setSiteErrors((e) => ({ ...e, [sceneId]: result.errors[0].message }));
            } else {
                setSiteStatuses((s) => ({ ...s, [sceneId]: "done" }));
                applyRegenerated(result.regenerated);
            }
            /* tslint:disable-next-line */
            /* eslint-disable  @typescript-eslint/no-explicit-any */
        } catch (err: any) {
            setSiteStatuses((s) => ({ ...s, [sceneId]: "error" }));
            setSiteErrors((e) => ({ ...e, [sceneId]: err?.message ?? "Unknown error" }));
        }
    };

    //--------------------------------------------------------------------------
    const regenerateAll = async () => {
        setRegeneratingAll(true);
        setLastResult(null);
        try {
            const resp = await fetch(`${API}/regenerate`, { method: "POST" });
            const result: RegenerateResult = await resp.json();
            setLastResult(result);
            applyRegenerated(result.regenerated);
            /* tslint:disable-next-line */
            /* eslint-disable  @typescript-eslint/no-explicit-any */
        } catch (err: any) {
            setLastResult({ regenerated: [], errors: [{ sceneId: "*", message: err?.message ?? "Unknown error" }] });
        } finally {
            setRegeneratingAll(false);
        }
    };

    //--------------------------------------------------------------------------
    const loadedCount = factories.filter((f) => datasetsBySite.has(f.scene_id)).length;

    //--------------------------------------------------------------------------
    return (
        <div className="flex flex-col min-h-dvh bg-linear-to-br from-slate-50 to-slate-100">
            <div className="flex flex-col container mx-auto max-w-4xl grow">
                {/* Header */}
                <div className="flex items-center gap-3 my-8 px-4 lg:px-0">
                    <a
                        href="/"
                        className="text-muted hover:text-default transition-colors text-sm flex items-center gap-1 cursor-pointer"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </a>
                    <span className="text-muted">/</span>
                    <h1 className="text-lg font-bold">Dataset Management</h1>
                </div>

                <div className="bg-slate-100 px-10 py-9 rounded-t-3xl grow">
                    {/* Actions bar */}
                    <div className="flex items-center justify-between mb-6">
                        <p className="text-sm text-subtle">
                            {loading
                                ? "Loading…"
                                : `${loadedCount} of ${factories.length} factor${factories.length !== 1 ? "ies" : "y"} have a dataset`}
                        </p>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={fetchSites} disabled={loading}>
                                Refresh
                            </Button>
                            <Button
                                variant="plain"
                                colorScheme="accent"
                                size="sm"
                                isLoading={regeneratingAll}
                                onClick={regenerateAll}
                                disabled={regeneratingAll}
                            >
                                Regenerate All
                            </Button>
                        </div>
                    </div>

                    {/* Global result banner */}
                    {lastResult && (
                        <div
                            className={`mb-6 rounded-xl px-4 py-3 text-sm ${
                                lastResult.errors.length > 0
                                    ? "bg-negative-50 text-negative-700 border border-negative-200"
                                    : "bg-positive-50 text-positive-700 border border-positive-200"
                            }`}
                        >
                            {lastResult.errors.length > 0 ? (
                                <>
                                    <span className="font-semibold">
                                        Regeneration failed for {lastResult.errors.length} site(s):
                                    </span>{" "}
                                    {lastResult.errors.map((e) => e.message).join(", ")}
                                </>
                            ) : (
                                <>
                                    <span className="font-semibold">
                                        Regenerated {lastResult.regenerated.length} site(s)
                                    </span>
                                    {" — reference timestamp updated."}
                                </>
                            )}
                        </div>
                    )}

                    {/* Fetch error */}
                    {fetchError && (
                        <div className="rounded-xl bg-negative-50 border border-negative-200 text-negative-700 px-4 py-3 text-sm mb-6">
                            {fetchError}
                        </div>
                    )}

                    {/* Factory list */}
                    {factories.length === 0 ? (
                        <div className="rounded-2xl bg-slate-50 border border-slate-200 text-center py-16 text-subtle text-sm">
                            No factories found. Check the 3dverse folder configuration.
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {factories.map((factory) => (
                                <FactoryDatasetRow
                                    key={factory.scene_id}
                                    factory={factory}
                                    dataset={datasetsBySite.get(factory.scene_id) ?? null}
                                    status={siteStatuses[factory.scene_id] ?? "idle"}
                                    error={siteErrors[factory.scene_id]}
                                    loadingMeta={loading}
                                    onRegenerate={() => regenerateSite(factory.scene_id)}
                                    onOpen={() => navigate(`/${factory.slug}`)}
                                />
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

//------------------------------------------------------------------------------
function FactoryDatasetRow({
    factory,
    dataset,
    status,
    error,
    loadingMeta,
    onRegenerate,
    onOpen,
}: {
    factory: Factory;
    dataset: DatasetMeta | null;
    status: SiteStatus;
    error?: string;
    loadingMeta: boolean;
    onRegenerate: () => void;
    onOpen: () => void;
}) {
    const hasDataset = dataset !== null;

    return (
        <li className="bg-white rounded-md border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 flex items-start gap-4">
                {/* Status dot */}
                <span
                    className={`shrink-0 w-2.5 h-2.5 rounded-full mt-2 ${
                        status === "loading"
                            ? "bg-warning-400 animate-pulse"
                            : status === "done"
                              ? "bg-positive-400"
                              : status === "error"
                                ? "bg-negative-400"
                                : hasDataset
                                  ? "bg-positive-300"
                                  : loadingMeta
                                    ? "bg-slate-200 animate-pulse"
                                    : "bg-slate-300"
                    }`}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="font-semibold text-default truncate">{factory.name}</span>
                        {factory.location && <span className="text-xs text-subtle shrink-0">{factory.location}</span>}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted">
                        <span className="font-mono" title={factory.scene_id}>
                            {truncate(factory.scene_id, 12)}
                        </span>
                        <span className="text-slate-300">·</span>
                        {loadingMeta && !dataset ? (
                            <span className="text-slate-400">checking…</span>
                        ) : hasDataset ? (
                            <span className="text-subtle">
                                Generated <span className="text-default">{formatDate(dataset.now)}</span>
                            </span>
                        ) : (
                            <span className="text-warning-600 font-medium">No dataset</span>
                        )}
                    </div>

                    {error && <p className="text-xs text-negative-600 mt-1">{error}</p>}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="xs" onClick={onOpen}>
                        Open
                    </Button>
                    <Button
                        variant="outline"
                        size="xs"
                        isLoading={status === "loading"}
                        disabled={status === "loading"}
                        onClick={onRegenerate}
                    >
                        Regenerate
                    </Button>
                </div>
            </div>
        </li>
    );
}
