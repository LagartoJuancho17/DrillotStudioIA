#!/usr/bin/env python3
import os
import sys
import glob
import json
import subprocess
from PIL import Image

LAB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../public/img/lab"))
CONFIG_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../src/data/config.json"))

print(f"Scanning assets in: {LAB_DIR}")

def optimize_image(filepath):
    """Converts image to .webp (max dimension 1920px, q=82) and removes original."""
    ext = os.path.splitext(filepath)[1].lower()
    if ext == ".webp":
        return filepath
    
    webp_path = os.path.splitext(filepath)[0] + ".webp"
    try:
        with Image.open(filepath) as im:
            im.thumbnail((1920, 1920), Image.Resampling.LANCZOS)
            if im.mode in ("RGBA", "P"):
                im = im.convert("RGBA")
            else:
                im = im.convert("RGB")
            im.save(webp_path, "WEBP", quality=82, method=6)
        
        orig_size = os.path.getsize(filepath)
        new_size = os.path.getsize(webp_path)
        print(f"  ✓ {os.path.basename(filepath)} -> {os.path.basename(webp_path)} ({orig_size // 1024} KB -> {new_size // 1024} KB)")
        
        # Remove original file if webp was created
        if os.path.exists(webp_path) and os.path.getsize(webp_path) > 0:
            os.remove(filepath)
        return webp_path
    except Exception as e:
        print(f"  ! Error optimizing {filepath}: {e}")
        return filepath

def optimize_video(filepath):
    """Compresses video with ffmpeg: 720p max, no audio (-an), CRF 27, H.264, +faststart."""
    if not filepath.endswith(".mp4") or filepath.endswith("._opt.mp4"):
        return filepath

    tmp_path = os.path.splitext(filepath)[0] + "._opt.mp4"
    cmd = [
        "ffmpeg", "-y", "-i", filepath,
        "-an",
        "-vf", "scale='min(1280,iw)':-2",
        "-c:v", "libx264",
        "-crf", "27",
        "-preset", "slow",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        tmp_path
    ]
    try:
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        orig_size = os.path.getsize(filepath)
        new_size = os.path.getsize(tmp_path)
        if new_size < orig_size:
            os.replace(tmp_path, filepath)
            print(f"  ✓ {os.path.basename(filepath)} video compressed ({orig_size // 1024} KB -> {new_size // 1024} KB)")
        else:
            os.remove(tmp_path)
            print(f"  ~ {os.path.basename(filepath)} already optimal")
    except Exception as e:
        print(f"  ! Video optimization error for {filepath}: {e}")
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

def process_folder(folder_path):
    print(f"\nProcessing folder: {os.path.basename(folder_path)}")
    for root, _, files in os.walk(folder_path):
        for f in files:
            if f.startswith("."):
                continue
            full_p = os.path.join(root, f)
            ext = os.path.splitext(f)[1].lower()
            if ext in (".jpg", ".jpeg", ".png"):
                optimize_image(full_p)
            elif ext == ".mp4":
                optimize_video(full_p)

# 1. Run optimization across all lab project folders
for entry in os.listdir(LAB_DIR):
    p = os.path.join(LAB_DIR, entry)
    if os.path.isdir(p):
        process_folder(p)

# 2. Update config.json to reference .webp files and update dimensions
print("\nUpdating src/data/config.json...")
if os.path.exists(CONFIG_PATH):
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    def update_image_ref(img_obj):
        if not img_obj:
            return img_obj
        if isinstance(img_obj, str):
            src = img_obj
            new_src = os.path.splitext(src)[0] + ".webp" if not src.endswith(".webp") else src
            return new_src
        elif isinstance(img_obj, dict):
            src = img_obj.get("src", "")
            if src and not src.endswith(".webp"):
                base_no_ext = os.path.splitext(src)[0]
                img_obj["src"] = base_no_ext + ".webp"
            
            # Read actual dimensions on disk if file exists
            abs_disk_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../public", img_obj["src"].lstrip("/")))
            if os.path.exists(abs_disk_path):
                try:
                    with Image.open(abs_disk_path) as im:
                        img_obj["w"], img_obj["h"] = im.size
                except Exception:
                    pass
            return img_obj
        return img_obj

    for proj in data.get("labProjects", []):
        if "cover" in proj:
            proj["cover"] = update_image_ref(proj["cover"])
        if "images" in proj and isinstance(proj["images"], list):
            proj["images"] = [update_image_ref(img) for img in proj["images"]]

    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print("  ✓ config.json updated with .webp extensions and exact dimensions!")

print("\nOptimization Complete!")
