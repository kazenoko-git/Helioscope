import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import LoadingSpinner from "./LoadingSpinner";

export default function BatchProcessor() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [csvPath, setCsvPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Normalize any weird dialog return types
  const normalizePath = (file: any): string | null => {
    if (!file) return null;

    if (typeof file === "string") return file;
    if (Array.isArray(file)) return file[0] || null;
    if (file?.path) return file.path;

    return null;
  };

  const handleChooseCSV = async () => {
    try {
      setError(null);

      const file = await open({
        multiple: false,
        filters: [{ name: "CSV", extensions: ["csv"] }],
      });

      const normalized = normalizePath(file);

      if (!normalized) {
        setError("Could not read file path from file picker.");
        return;
      }

      setCsvPath(normalized);
    } catch (err: any) {
      setError(`Failed to open CSV: ${err}`);
    }
  };

  const handleBatchProcess = async () => {
    if (!csvPath) {
      setError("Please select a CSV file first.");
      return;
    }

    setLoading(true);
    setResults([]);
    setError(null);

    try {
      const batchResults = await invoke<any[]>("process_csv_batch", {
        csvPath,
        zoom: 18,
        radius: 1,
        provider: "esri",
      });

      setResults(batchResults);

      await invoke("save_batch_results", {
        detections: batchResults,
        batchName: "batch",
      });

      alert(`✅ Processed ${batchResults.length} locations successfully!`);
    } catch (err: any) {
      console.error("Batch error:", err);
      setError(err.toString());
      alert(`❌ Batch processing failed:\n${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-6 bg-slate-900 rounded-xl border border-slate-700 shadow-lg">
        <h3 className="text-lg font-semibold mb-3">Batch Processing</h3>

        <p className="text-sm text-slate-400 mb-4">
          Upload a CSV to process multiple coordinates.<br />
          Format:{" "}
          <code className="bg-slate-800 px-2 py-1 rounded text-amber-400">
            sample_id,lat,lon
          </code>
        </p>

        {csvPath && (
          <div className="mb-3 text-xs text-amber-300 break-all">
            📄 Selected: {csvPath}
          </div>
        )}

        {error && (
          <div className="mb-3 text-xs text-red-400">
            ⚠️ {error}
          </div>
        )}

        {!loading ? (
          <div className="flex gap-3">
            <button
              onClick={handleChooseCSV}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 px-4 rounded-lg transition-all"
            >
              📂 Choose CSV File
            </button>

            <button
              onClick={handleBatchProcess}
              disabled={!csvPath}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                csvPath
                  ? "bg-amber-500 hover:bg-amber-400 text-black"
                  : "bg-slate-700 text-slate-500 cursor-not-allowed"
              }`}
            >
              ▶️ Start
            </button>
          </div>
        ) : (
          <LoadingSpinner size="small" message="Processing batch..." />
        )}
      </div>

      {results.length > 0 && (
        <div className="p-6 bg-slate-900 rounded-xl border border-slate-700">
          <h4 className="font-semibold mb-3">Results Summary</h4>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Processed:</span>
              <span className="font-semibold text-white">{results.length}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Detections:</span>
              <span className="font-semibold text-green-400">
                {results.filter(r => r.has_solar).length}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">No Solar:</span>
              <span className="font-semibold text-red-400">
                {results.filter(r => !r.has_solar).length}
              </span>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-800 pt-4">
            <h5 className="font-semibold mb-2 text-sm">Preview (first 5):</h5>

            <pre className="text-xs bg-slate-800 p-3 rounded-lg max-h-48 overflow-auto">
{JSON.stringify(results.slice(0, 5), null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
