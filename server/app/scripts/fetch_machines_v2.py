import os
import shutil
import pandas as pd
import json
# We use icrawler (Bing) because DuckDuckGo (DDGS) blocks us after 6 requests
from icrawler.builtin import BingImageCrawler
from PIL import Image

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, "matunga_cr_workshop_machines_dummy_data.csv")
# Final destination for optimized images
FINAL_DIR = os.path.join(BASE_DIR, "../../data/machines") 
# Temporary folder for raw downloads
TEMP_DIR = os.path.join(BASE_DIR, "temp_downloads")

MAX_WIDTH = 800

def ensure_dir(directory):
    if not os.path.exists(directory):
        os.makedirs(directory)

def optimize_and_move(src_path, dest_path):
    """Reads raw image, optimizes it, and saves to final destination."""
    try:
        img = Image.open(src_path)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        
        # Resize
        if img.width > MAX_WIDTH:
            ratio = MAX_WIDTH / float(img.width)
            new_height = int((float(img.height) * float(ratio)))
            img = img.resize((MAX_WIDTH, new_height), Image.Resampling.LANCZOS)

        # Save as WebP
        img.save(dest_path, "WEBP", quality=85, optimize=True)
        return True
    except Exception as e:
        print(f"    [!] Error optimization {os.path.basename(src_path)}: {e}")
        return False

def main():
    # 1. Read CSV
    try:
        df = pd.read_csv(CSV_PATH)
        unique_machines = df['machine_type'].dropna().unique()
        print(f"--- Found {len(unique_machines)} unique machine types ---")
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return

    ensure_dir(FINAL_DIR)
    ensure_dir(TEMP_DIR)
    
    image_map = {}

    # 2. Crawl and Process
    for machine_name in unique_machines:
        clean_name = machine_name.lower().replace(" ", "_").replace("/", "_")
        search_query = f"{machine_name} industrial railway machine"
        
        print(f"\nProcessing: {machine_name}...")

        # A. Create a specific temp folder for this machine to avoid collisions
        machine_temp_dir = os.path.join(TEMP_DIR, clean_name)
        ensure_dir(machine_temp_dir)

        # B. Crawl using Bing (More reliable)
        # We turn off logs to keep console clean
        crawler = BingImageCrawler(
            storage={'root_dir': machine_temp_dir}, 
            log_level='ERROR',
            feeder_threads=1,
            parser_threads=1,
            downloader_threads=2
        )
        crawler.crawl(keyword=search_query, max_num=3)

        # C. Process the downloaded files
        downloaded_files = sorted(os.listdir(machine_temp_dir))
        saved_files = []
        
        count = 1
        for raw_file in downloaded_files:
            src = os.path.join(machine_temp_dir, raw_file)
            
            # Define final name: cnc_lathe_1.webp
            final_filename = f"{clean_name}_{count}.webp"
            dest = os.path.join(FINAL_DIR, final_filename)
            
            if optimize_and_move(src, dest):
                saved_files.append(final_filename)
                count += 1
            
        if saved_files:
            print(f"  [✓] Processed {len(saved_files)} images")
            image_map[machine_name] = saved_files
        else:
            print(f"  [!] No images found for {machine_name}")

    # 3. Clean up Temp
    try:
        shutil.rmtree(TEMP_DIR)
        print("\n--- Cleaned up temporary files ---")
    except:
        pass

    # 4. Save Map
    map_path = os.path.join(FINAL_DIR, "machine_image_map.json")
    with open(map_path, "w") as f:
        json.dump(image_map, f, indent=2)
    
    print(f"--- Success! Check {FINAL_DIR} ---")

if __name__ == "__main__":
    main()