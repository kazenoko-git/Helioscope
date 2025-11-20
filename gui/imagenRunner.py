import sys,os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from imagen import Imagen

# Parse args
lat = float(sys.argv[1])
lon = float(sys.argv[2])
zoom = int(sys.argv[3])
radius = int(sys.argv[4])
provider = sys.argv[5]

# Download tiles
img = Imagen(provider=provider).getMegaStitchedTiles(lat, lon, zoom, radius)

output = f"tile_{lat}_{lon}_{zoom}.png"
img.save(output)

# Print ONLY the path (Tauri will capture this)
print(output)
