#![cfg_attr(not(debug_assertions), windows_subsystem = "macos")]

use std::{
    env,
    path::PathBuf,
    process::Command,
    fs,
};

use tauri::command;
use tauri::Manager; // <-- REQUIRED TRAIT FOR get_webview_window()
use base64::{engine::general_purpose, Engine as _};

/// Calls imagenRunner.py, waits for it to save a PNG, reads it, and
/// returns a base64 data URL: "data:image/png;base64,..."
#[command]
fn fetch_stitched_tile(
    lat: f64,
    lon: f64,
    zoom: u32,
    radius: u32,
    provider: String,
) -> Result<String, String> {
    let current_dir = env::current_dir().map_err(|e| e.to_string())?;
    let gui_dir = current_dir
        .parent()
        .ok_or("Cannot find gui dir")?
        .to_path_buf();

    let project_root = gui_dir
        .parent()
        .ok_or("Cannot find project root")?
        .to_path_buf();

    let python_path = project_root.join(".venv").join("bin").join("python");
    if !python_path.exists() {
        return Err(format!(
            "Python venv not found at {}",
            python_path.display()
        ));
    }

    let script_path = gui_dir.join("imagenRunner.py");
    if !script_path.exists() {
        return Err(format!(
            "imagenRunner.py not found at {}",
            script_path.display()
        ));
    }

    println!("Using python: {}", python_path.display());
    println!("Using script: {}", script_path.display());

    let output = Command::new(&python_path)
        .current_dir(&gui_dir)
        .arg(&script_path)
        .arg(lat.to_string())
        .arg(lon.to_string())
        .arg(zoom.to_string())
        .arg(radius.to_string())
        .arg(&provider)
        .output()
        .map_err(|e| format!("Failed to spawn python: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Python failed: {stderr}"));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let rel_path = stdout.lines().last().unwrap_or("").trim().to_string();

    if rel_path.is_empty() {
        return Err("Python did not return an output path".into());
    }

    let img_path: PathBuf = gui_dir.join(&rel_path);
    println!("Python output path: {}", img_path.display());

    if !img_path.exists() {
        return Err(format!("Image file not found at {}", img_path.display()));
    }

    let bytes = fs::read(&img_path).map_err(|e| format!("Failed to read PNG: {e}"))?;
    let b64 = general_purpose::STANDARD.encode(bytes);

    Ok(format!("data:image/png;base64,{}", b64))
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Correct Tauri v2 window handling
            if let Some(win) = app.get_webview_window("main") {
                win.set_title("Helioscope")?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![fetch_stitched_tile])
        .run(tauri::generate_context!())
        .expect("error while running Tauri app");
}
