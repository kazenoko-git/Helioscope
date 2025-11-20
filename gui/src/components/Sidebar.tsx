import { useState } from "react";

type SidebarProps = {
  lat: number;
  lon: number;
  setLat: (v: number) => void;
  setLon: (v: number) => void;
  onFetch: (params: { zoom: number; radius: number; provider: string }) => void;
  loading: boolean;
};

export default function Sidebar({
  lat,
  lon,
  setLat,
  setLon,
  onFetch,
  loading,
}: SidebarProps) {
  const [zoom, setZoom] = useState(18);
  const [radius, setRadius] = useState(1);
  const [provider, setProvider] = useState("esri");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onFetch({ zoom, radius, provider });
  };

  return (
    <div className="w-80 bg-slate-950 border-r border-slate-800 p-6 flex flex-col gap-6">
      {/* Logo */}
      <div className="space-y-1">
        <h1 className="text-4xl font-extrabold tracking-tight">Helioscope</h1>
        <p className="text-xs text-slate-500">by Wing-It Team</p>
      </div>

      {/* Form */}
      <form onSubmit={submit} className="flex flex-col gap-4 flex-1">
        <label className="text-sm text-slate-300">
          Latitude
          <input
            type="number"
            step="0.0000001"
            value={lat}
            onChange={(e) => setLat(parseFloat(e.target.value))}
            className="mt-1 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm outline-none border border-slate-700 focus:border-amber-400"
          />
        </label>

        <label className="text-sm text-slate-300">
          Longitude
          <input
            type="number"
            step="0.0000001"
            value={lon}
            onChange={(e) => setLon(parseFloat(e.target.value))}
            className="mt-1 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm outline-none border border-slate-700 focus:border-amber-400"
          />
        </label>

        <label className="text-sm text-slate-300">
          Zoom
          <input
            type="number"
            min={1}
            max={22}
            value={zoom}
            onChange={(e) => setZoom(parseInt(e.target.value || "0", 10))}
            className="mt-1 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm outline-none border border-slate-700 focus:border-amber-400"
          />
        </label>

        <label className="text-sm text-slate-300">
          Radius (tiles)
          <input
            type="number"
            min={0}
            max={5}
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value || "0", 10))}
            className="mt-1 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm outline-none border border-slate-700 focus:border-amber-400"
          />
        </label>

        <label className="text-sm text-slate-300">
          Provider
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="mt-1 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm outline-none border border-slate-700 focus:border-amber-400"
          >
            <option value="esri">ESRI</option>
            <option value="google">Google (API key required)</option>
            <option value="bing">Bing (TODO)</option>
            <option value="gibs">NASA GIBS (single tiles)</option>
          </select>
        </label>

        <div className="flex-1" />

        <button
  type="submit"
  disabled={loading}
  className="mt-2 w-full rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold py-2 text-sm transition"
>
  {loading ? "Running analysis..." : "Start AI analysis"}
</button>

      </form>
    </div>
  );
}
