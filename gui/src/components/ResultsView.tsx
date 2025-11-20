export type SiteMeta = {
  sample_id: string;
  lat: number;
  lon: number;
  zoom: number;
  radius: number;
  provider: string;
};

export type AiResult = {
  sample_id: string;
  lat: number;
  lon: number;
  has_solar: boolean;
  confidence: number;
  panel_count_est: number;
  pv_area_sqm_est: number;
  capacity_kw_est: number;
  qc_status: "verifiable" | "not_verifiable" | string;
  qc_notes: string[];
  bbox_or_mask: string;
  image_metadata: {
    source: string;
    capture_date: string;
  };
};

type ResultsViewProps = {
  meta: SiteMeta;
  result: AiResult;
  imageSrc: string | null;
  onBack: () => void;
};

export default function ResultsView({
  meta,
  result,
  imageSrc,
  onBack,
}: ResultsViewProps) {
  const jsonRecord = {
    sample_id: meta.sample_id,
    lat: meta.lat,
    lon: meta.lon,
    has_solar: result.has_solar,
    confidence: result.confidence,
    panel_count_est: result.panel_count_est,
    pv_area_sqm_est: result.pv_area_sqm_est,
    capacity_kw_est: result.capacity_kw_est,
    qc_status: result.qc_status,
    qc_notes: result.qc_notes,
    bbox_or_mask: result.bbox_or_mask,
    image_metadata: result.image_metadata,
    zoom: meta.zoom,
    radius: meta.radius,
    provider: meta.provider,
  };

  const handleSaveJson = () => {
    const blob = new Blob([JSON.stringify(jsonRecord, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `helioscope_${meta.sample_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveImage = () => {
    if (!imageSrc) return;
    const a = document.createElement("a");
    a.href = imageSrc;
    a.download = `helioscope_${meta.sample_id}.png`;
    a.click();
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full">
        {/* HEADER */}
        <header className="flex items-center justify-between px-8 py-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Helioscope
            </h1>
            <p className="text-xs text-slate-500">by Wing-It Team</p>
          </div>

          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800 transition"
          >
            ← Back to map
          </button>
        </header>

        {/* BODY */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: data */}
          <div className="w-96 bg-slate-950 border-r border-slate-800 px-8 py-6 overflow-y-auto">
            <h2 className="text-sm font-semibold text-slate-200 mb-3">
              Site summary
            </h2>

            <dl className="text-xs space-y-1 text-slate-300 mb-4">
              <div>
                <dt className="font-mono text-slate-500">sample_id</dt>
                <dd>{meta.sample_id}</dd>
              </div>
              <div>
                <dt className="font-mono text-slate-500">lat, lon</dt>
                <dd>
                  {meta.lat.toFixed(6)}, {meta.lon.toFixed(6)}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-slate-500">zoom / radius</dt>
                <dd>
                  {meta.zoom} / {meta.radius}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-slate-500">provider</dt>
                <dd>{meta.provider}</dd>
              </div>
            </dl>

            <h2 className="text-sm font-semibold text-slate-200 mb-3">
              AI inference
            </h2>

            <dl className="text-xs space-y-1 text-slate-300 mb-4">
              <div>
                <dt className="font-mono text-slate-500">has_solar</dt>
                <dd>{String(result.has_solar)}</dd>
              </div>
              <div>
                <dt className="font-mono text-slate-500">confidence</dt>
                <dd>{(result.confidence * 100).toFixed(1)}%</dd>
              </div>
              <div>
                <dt className="font-mono text-slate-500">panel_count_est</dt>
                <dd>{result.panel_count_est}</dd>
              </div>
              <div>
                <dt className="font-mono text-slate-500">pv_area_sqm_est</dt>
                <dd>{result.pv_area_sqm_est.toFixed(2)} m²</dd>
              </div>
              <div>
                <dt className="font-mono text-slate-500">capacity_kw_est</dt>
                <dd>{result.capacity_kw_est.toFixed(2)} kW</dd>
              </div>
              <div>
                <dt className="font-mono text-slate-500">qc_status</dt>
                <dd>{result.qc_status}</dd>
              </div>
            </dl>

            <div className="mb-4">
              <div className="text-xs font-mono text-slate-500">qc_notes:</div>
              <ul className="text-xs text-slate-300 list-disc list-inside">
                {result.qc_notes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>

            <div className="mb-6 text-xs text-slate-400">
              <div className="font-mono text-slate-500">image_metadata:</div>
              <div>source: {result.image_metadata.source}</div>
              <div>capture_date: {result.image_metadata.capture_date}</div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveJson}
                className="flex-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 text-sm font-semibold py-2 transition"
              >
                Save data as JSON
              </button>
              <button
                onClick={handleSaveImage}
                className="flex-1 rounded-lg border border-slate-700 hover:bg-slate-800 text-sm py-2 transition"
              >
                Save image
              </button>
            </div>
          </div>

          {/* RIGHT: image */}
          <div className="flex-1 min-w-0 min-h-0 flex flex-col bg-black">
            <div className="px-4 py-2 text-xs text-slate-300 border-b border-slate-800">
              Satellite image (stitched tile)
            </div>
            <div className="flex-1 flex items-center justify-center overflow-hidden bg-black">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt="Stitched satellite tile"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <span className="text-xs text-slate-500">
                  No image available
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
