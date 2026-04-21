import pandas as pd
import cloudinary
import cloudinary.uploader
import os
import re

# --- 1. Cloudinary Configuration ---
cloudinary.config(
    cloud_name = "dxvvzdpzk",
    api_key = "569928554572799",
    api_secret = "_HlfBvpbiQmpbclLvo5GRIh3_UQ",
    secure = True
)

# --- 2. Paths and Setup ---
CSV_PATH = "/Users/arjundangle/Arjun/CR-Workshop-Management-System/server/app/scripts/matunga_cr_workshop_machines_dummy_data.csv"
IMAGE_DIR = "/Users/arjundangle/Arjun/CR-Workshop-Management-System/server/data/machines"
OUTPUT_CSV = CSV_PATH 

# --- 3. Manual Alias Map for missing matches ---
# Mapping problematic CSV types to existing image keywords
ALIAS_MAP = {
    "planer machine": "shaper",
    "centre lathe": "lathe",
    "bearing induction heater": "heater"
}

def clean_string(s):
    """Standardizes strings for comparison."""
    return re.sub(r'[_+\-]', ' ', str(s)).lower().strip()

def upload_machine_images():
    if not os.path.exists(CSV_PATH):
        print(f"❌ Error: CSV not found")
        return
    
    df = pd.read_csv(CSV_PATH)
    print(f"Loaded {len(df)} machines from CSV.")

    available_images = [f for f in os.listdir(IMAGE_DIR) if not f.startswith('.')]
    
    uploads_count = 0
    url_cache = {}
    stopwords = {'machine', 'system', 'fixture', 'jig', 'rig', 'unit'}

    for index, row in df.iterrows():
        machine_type = str(row['machine_type']).strip()
        type_lower = machine_type.lower()
        
        if machine_type in url_cache:
            df.at[index, 'image_url'] = url_cache[machine_type]
            uploads_count += 1
            continue

        match = None
        type_clean = clean_string(machine_type)
        keywords = [w for w in type_clean.split() if w not in stopwords and len(w) > 3]

        # STEP 1: Direct Phrase Match
        for img_file in available_images:
            if type_clean in clean_string(img_file):
                match = img_file
                break
        
        # STEP 2: Keyword Match
        if not match:
            for img_file in available_images:
                img_clean = clean_string(img_file)
                if any(kw in img_clean for kw in keywords):
                    match = img_file
                    break
        
        # STEP 3: Manual Alias Match (for Planer -> Shaper etc)
        if not match and type_lower in ALIAS_MAP:
            alias_kw = ALIAS_MAP[type_lower]
            for img_file in available_images:
                if alias_kw in clean_string(img_file):
                    match = img_file
                    break

        if match:
            img_path = os.path.join(IMAGE_DIR, match)
            print(f"[{index+1}/{len(df)}] Match: '{machine_type}' -> '{match}'")
            
            try:
                public_id = f"type_{type_clean.replace(' ', '_')[:30]}"
                upload_result = cloudinary.uploader.upload(
                    img_path, 
                    public_id = public_id,
                    folder = "cr_workshop_machines",
                    overwrite = True
                )
                
                secure_url = upload_result['secure_url']
                df.at[index, 'image_url'] = secure_url
                url_cache[machine_type] = secure_url
                uploads_count += 1
                print(f"   ✅ Success")
            except Exception as e:
                print(f"   ❌ Cloudinary Error: {e}")
        else:
            print(f"[{index+1}/{len(df)}] ⚠️ No match for: {machine_type}")

    # Final Save
    df.to_csv(OUTPUT_CSV, index=False)
    print(f"\n--- Final Process Complete ---")
    print(f"Total machine records with URLs: {uploads_count}/120")

if __name__ == "__main__":
    upload_machine_images()