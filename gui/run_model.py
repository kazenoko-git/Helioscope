import sys
import json
from ultralytics import YOLO
from PIL import Image
import os

def main():
    if len(sys.argv) < 3:
        print("{}", end="")
        return

    image_path = sys.argv[1]
    model_path = sys.argv[2]

    model = YOLO(model_path)

    results = model.predict(image_path)

    result = results[0]

    # --- Basic fields ---
    has_solar = result.masks is not None
    confidence = float(max(result.boxes.conf)) if has_solar else 0.0
    panel_count = len(result.masks.data) if has_solar else 0

    qc_status = "verifiable" if has_solar else "not_verifiable"
    qc_notes = []
    if has_solar:
        qc_notes.append("distinct module grid")

    # --- Save audit overlay ---
    out_path = image_path.replace(".png", "_annotated.png")
    result.save(out_path)

    # --- Convert masks to polygons ---
    polygons = []
    if has_solar:
        for p in result.masks.xy:
            polygons.append(p.tolist())

    output = {
        "has_solar": has_solar,
        "confidence": confidence,
        "panel_count_est": panel_count,
        "pv_area_sqm_est": 1.6 * panel_count,  # TODO: improve
        "capacity_kw_est": 0.3 * panel_count,  # TODO: improve
        "qc_status": qc_status,
        "qc_notes": qc_notes,
        "bbox_or_mask": polygons,
        "audit_overlay_path": out_path
    }

    print(json.dumps(output))

if __name__ == "__main__":
    main()
