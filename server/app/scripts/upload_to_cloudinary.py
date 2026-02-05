import os
import json
import cloudinary
import cloudinary.uploader

# --- CONFIGURATION (REPLACE THESE) ---
CLOUDINARY_CONFIG = {
    "cloud_name": "dxvvzdpzk", 
    "api_key": "569928554572799", 
    "api_secret": "_HlfBvpbiQmpbclLvo5GRIh3_UQ"
}

# --- PATHS ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "../../data/machines")
INPUT_MAP = os.path.join(DATA_DIR, "machine_image_map.json")
OUTPUT_MAP = os.path.join(DATA_DIR, "machine_cloudinary_url_map.json")

def main():
    # 1. Setup Cloudinary
    cloudinary.config(
        cloud_name=CLOUDINARY_CONFIG["cloud_name"],
        api_key=CLOUDINARY_CONFIG["api_key"],
        api_secret=CLOUDINARY_CONFIG["api_secret"]
    )

    # 2. Load Local Map
    if not os.path.exists(INPUT_MAP):
        print("Error: machine_image_map.json not found. Run the fetch script first.")
        return

    with open(INPUT_MAP, "r") as f:
        local_map = json.load(f)

    print(f"--- Starting Upload for {len(local_map)} Machine Types ---")
    
    cloud_map = {}

    # 3. Upload Loop
    for machine_name, files in local_map.items():
        print(f"\nUploading: {machine_name}...")
        cloud_urls = []
        
        for filename in files:
            file_path = os.path.join(DATA_DIR, filename)
            
            if not os.path.exists(file_path):
                print(f"  [!] File not found: {filename}")
                continue

            try:
                # Upload to specific folder
                # use_filename=True keeps the clean name (cnc_lathe_1)
                response = cloudinary.uploader.upload(
                    file_path,
                    folder="cr_workshop/machines",
                    use_filename=True,
                    unique_filename=False,
                    overwrite=True
                )
                
                secure_url = response["secure_url"]
                print(f"  [✓] Uploaded: {filename}")
                cloud_urls.append(secure_url)
                
            except Exception as e:
                print(f"  [X] Upload Failed: {e}")

        if cloud_urls:
            cloud_map[machine_name] = cloud_urls

    # 4. Save the URL Map
    with open(OUTPUT_MAP, "w") as f:
        json.dump(cloud_map, f, indent=2)

    print(f"\n--- Upload Complete! ---")
    print(f"URL Map saved to: {OUTPUT_MAP}")
    print("Next Step: Use these URLs to update the database.")

if __name__ == "__main__":
    main()