import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import Sidebar from "./components/Sidebar";
import MapPicker from "./components/MapPicker";
import ResultsView, { AiResult, SiteMeta } from "./components/ResultsView";

type FetchParams = {
  zoom: number;
  radius: number;
  provider: string;
};

type View = "select" | "results";

export default function App() {
  // Global state
  const [lat, setLat] = useState(12.8604075);
  const [lon, setLon] = useState(77.6625644);

  const [view, setView] = useState<View>("select");
  const [loading, setLoading] = useState(false);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [siteMeta, setSiteMeta] = useState<SiteMeta | null>(null);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);

  // MAIN ANALYSIS FLOW (Window 1 → Window 2)
  const handleAnalyze = async ({ zoom, radius, provider }: FetchParams) => {
    console.log("Start AI analysis:", { lat, lon, zoom, radius, provider });

    setLoading(true);
    try {
      // 1. Fetch stitched tile via Tauri backend (imagenRunner)
      const dataUrl = await invoke<string>("fetch_stitched_tile", {
        lat,
        lon,
        zoom,
        radius,
        provider,
      });

      console.log("Tile data URL length:", dataUrl?.length || 0);
      setImageSrc(dataUrl);

      // 2. Site metadata (this will eventually match your CSV schema)
      const meta: SiteMeta = {
        sample_id: `${Date.now()}`,
        lat,
        lon,
        zoom,
        radius,
        provider: provider.toLowerCase(),
      };
      setSiteMeta(meta);

      // 3. TEMP: fake AI result on frontend
      // TODO: replace this with invoke<AiResult>("run_ai_analysis", {...})
      const fake: AiResult = {
        sample_id: meta.sample_id,
        lat: meta.lat,
        lon: meta.lon,
        has_solar: true,
        confidence: 0.87,
        panel_count_est: 18,
        pv_area_sqm_est: 32.4,
        capacity_kw_est: 6.5,
        qc_status: "verifiable",
        qc_notes: ["clear roof view", "distinct module grid", "strong shadows"],
        bbox_or_mask: "",
        image_metadata: {
          source: provider.toUpperCase(),
          capture_date: "2025-01-01",
        },
      };
      setAiResult(fake);

      // 4. Switch to Window 2
      setView("results");
    } catch (err) {
      console.error("Fetch / analysis failed:", err);
      alert("Failed to run analysis. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // WINDOW 2 – RESULTS
  if (view === "results" && siteMeta && aiResult) {
    return (
      <ResultsView
        meta={siteMeta}
        result={aiResult}
        imageSrc={imageSrc}
        onBack={() => setView("select")}
      />
    );
  }

  // WINDOW 1 – MAP SELECTION
  return (
    <div className="flex h-screen w-screen bg-slate-950 text-white overflow-hidden min-w-0 min-h-0">
      {/* LEFT: sidebar */}
      <Sidebar
        lat={lat}
        lon={lon}
        setLat={setLat}
        setLon={setLon}
        onFetch={handleAnalyze}
        loading={loading}
      />

      {/* RIGHT: full-bleed map */}
      <div className="flex-1 flex min-w-0 min-h-0">
        <MapPicker
          lat={lat}
          lon={lon}
          onChange={(newLat, newLon) => {
            setLat(newLat);
            setLon(newLon);
          }}
        />
      </div>
    </div>
  );
}
