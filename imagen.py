import mercantile, requests
from PIL import Image
from io import BytesIO




class Imagen:
    def __init__(self, provider="esri", timeout=5):
        """
        provider: "esri", "google", "gibs"
        timeout: request timeout (seconds)
        """
        if provider == "osm":
            raise ValueError("OSM tiles cannot be used programmatically due to usage policy.")

        self.provider = provider
        self.timeout = timeout

    # TILE URL BUILDERS
    def _tileURL(self, x, y, z, key=None):
        # ESRI (best)
        if self.provider == "esri":
            return (f"https://services.arcgisonline.com/ArcGIS/rest/services/"
                    f"World_Imagery/MapServer/tile/{z}/{y}/{x}")
        # Google (requires API key)
        elif self.provider == "google":
            if key is None:
                raise ValueError("Google Maps provider requires API key.")
            return f"https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&key={key}"
        # NASA GIBS (WMTS)
        if self.provider == "gibs":
            return self._getGIBS_WMS(x, y, z)
        else:
            raise ValueError(f"Unknown provider: {self.provider}")

    # SINGLE TILE DOWNLOADER
    def downTile(self, x, y, z, key=None):
        if self.provider == "gibs":
            raise RuntimeError("GIBS does not support tile download. Use getTiles() only.")
        url = self._tileURL(x, y, z, key)
        resp = requests.get(url, timeout=self.timeout)

        if resp.status_code != 200:
            raise RuntimeError(f"Tile download failed ({resp.status_code}): {url}")

        try:
            return Image.open(BytesIO(resp.content)).convert("RGB")
        except Exception:
            print("DEBUG — first 200 chars of tile response:")
            print(resp.text[:200])
            raise

    # GET ONE TILE FOR AI
    def getTiles(self, lat, lon, zoom, key=None):
        # GIBS: use WMS, not mercantile tiles
        if self.provider == "gibs":
            return self._getGIBS_WMS(lat, lon, zoom)

        # All other providers
        tile = mercantile.tile(lon, lat, zoom)
        return self.downTile(tile.x, tile.y, zoom, key)

    # GET STITCHED TILE GRID (GUI)
    def getStitchedTiles(self, lat, lon, zoom, radius=1, key=None):
        """
        radius=1 → 3×3 grid
        radius=2 → 5×5 grid
        """
        # TLDR: GIBS must be kept at reasonable zooms
        # TLDR TLDR: GIBS does not work at all
        if self.provider == "gibs": raise ValueError("GIBS does not support stitched tiles. Use ESRI/Google for tiling.")
        center = mercantile.tile(lon, lat, zoom)
        tiles = []
        for dy in range(-radius, radius + 1):
            row = []
            for dx in range(-radius, radius + 1):
                tx = center.x + dx
                ty = center.y + dy
                row.append(self.downTile(tx, ty, zoom, key))
            tiles.append(row)
        row_imgs = [self._hstack(row) for row in tiles]
        final = self._vstack(row_imgs)
        return final

    # UTILITY — STACKING
    def _hstack(self, images):
        widths, heights = zip(*(img.size for img in images))
        total_width = sum(widths)
        max_height = max(heights)
        out = Image.new("RGB", (total_width, max_height))
        x_offset = 0
        for img in images:
            out.paste(img, (x_offset, 0))
            x_offset += img.width
        return out

    def _vstack(self, images):
        widths, heights = zip(*(img.size for img in images))
        max_width = max(widths)
        total_height = sum(heights)
        out = Image.new("RGB", (max_width, total_height))
        y_offset = 0
        for img in images:
            out.paste(img, (0, y_offset))
            y_offset += img.height
        return out

    # UTILITY - GIBS IS AS BAD AS GIBBS FREE ENERGY
    def _getGIBS_WMS(self, lat, lon, zoom):
        # scale degrees for zoom
        scale_deg = {
            2: 20,
            3: 10,
            4: 5,
            5: 2,
            6: 1,
        }.get(zoom, 5)

        # BBOX (WMS 1.3.0, EPSG:4326 = miny,minx,maxy,maxx)
        lat1 = lat - scale_deg
        lon1 = lon - scale_deg
        lat2 = lat + scale_deg
        lon2 = lon + scale_deg

        layer = "VIIRS_SNPP_CorrectedReflectance_TrueColor"

        url = (
            "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?"
            "service=WMS"
            "&request=GetMap"
            f"&layers={layer}"
            "&styles="
            "&width=1024&height=1024"
            "&format=image/jpeg"
            "&transparent=false"
            "&version=1.3.0"
            "&crs=EPSG:4326"
            f"&bbox={lat1},{lon1},{lat2},{lon2}"
        )
        headers = {
            "User-Agent": "Mozilla/5.0 (compatible; Imagen/1.0)"
        }
        resp = requests.get(url, headers=headers, timeout=self.timeout)
        # Check success
        if resp.status_code != 200:
            print("GIBS request failed. Status:", resp.status_code)
            print("Response text:", resp.text[:500])
            raise RuntimeError("GIBS WMS request failed.")
        # Ensure NASA returned an image
        if "image" not in resp.headers.get("Content-Type", ""):
            print("NOT AN IMAGE. Response:", resp.text[:500])
            raise RuntimeError("GIBS returned non-image data.")
        return Image.open(BytesIO(resp.content)).convert("RGB")


