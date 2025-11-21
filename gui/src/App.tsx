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
  // --- GLOBAL STATE ---
  const [lat, setLat] = useState(12.8604075);
  const [lon, setLon] = useState(77.6625644);

  const [view, setView] = useState<View>("select");
  const [loading, setLoading] = useState(false);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [siteMeta, setSiteMeta] = useState<SiteMeta | null>(null);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);

  // --- MAIN ANALYSIS PIPELINE ---
  const handleAnalyze = async ({ zoom, radius, provider }: FetchParams) => {
    setLoading(true);
    console.log("Start AI analysis:", { lat, lon, zoom, radius, provider });

    try {
      // --------------------------------------------
      // 1) FETCH STITCHED TILE FROM PYTHON (imagenRunner)
      // --------------------------------------------
      const stitchedTile = await invoke<string>("fetch_stitched_tile", {
        lat,
        lon,
        zoom,
        radius,
        provider,
      });

      console.log("Tile data URL length:", stitchedTile?.length || 0);
      setImageSrc(stitchedTile);

      // --------------------------------------------
      // 2) BUILD SITE META (for ResultsView + JSON export)
      // --------------------------------------------
      const meta: SiteMeta = {
        sample_id: `${Date.now()}`,
        lat,
        lon,
        zoom,
        radius,
        provider: provider.toLowerCase(),
      };
      setSiteMeta(meta);

      // --------------------------------------------
      // 3) RUN YOLO AI MODEL (via run_ai_analysis)
      // --------------------------------------------
      const aiJson = await invoke<string>("run_ai_analysis", {
        imageB64: stitchedTile,
      });

      console.log("AI JSON:", aiJson);

      const parsed: AiResult = JSON.parse(aiJson);
      setAiResult({
        ...parsed,
        sample_id: meta.sample_id,
        lat: meta.lat,
        lon: meta.lon,
      });

      // --------------------------------------------
      // 4) SWITCH TO WINDOW 2 (RESULTS)
      // --------------------------------------------
      setView("results");
    } catch (err) {
      console.error("Fetch / AI failed:", err);
      alert("AI processing failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------
  // WINDOW 2 — RESULTS PAGE
  // --------------------------------------------
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

  // --------------------------------------------
  // WINDOW 1 — MAP + SIDEBAR
  // --------------------------------------------
  return (
    <div className="flex h-screen w-screen bg-slate-950 text-white overflow-hidden min-w-0 min-h-0">
      {/* SIDEBAR (left) */}
      <Sidebar
        lat={lat}
        lon={lon}
        setLat={setLat}
        setLon={setLon}
        onFetch={handleAnalyze}
        loading={loading}
      />

      {/* MAP AREA (right) */}
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
