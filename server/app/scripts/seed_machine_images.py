import os
import os
import json
import sys
from sqlmodel import Session, select

# --- SETUP PATH ---
sys.path.append(os.path.join(os.path.dirname(__file__), "../../"))

# --- DB ---
from app.core.database import engine

# --- MODELS ---
from app.modules.machine.machine_models import Machine
from app.modules.contractor.models import Contractor
from app.modules.incident.models import Incident
from app.models import Permit

# --- CONFIG ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
URL_MAP_PATH = os.path.join(BASE_DIR, "../../data/machines/machine_cloudinary_url_map.json")

def seed_images():
    if not os.path.exists(URL_MAP_PATH):
        print(f"Error: Cloudinary Map not found at {URL_MAP_PATH}")
        return

    with open(URL_MAP_PATH, "r") as f:
        url_map = json.load(f)
        # Normalize keys to lowercase for easier matching
        url_map_lower = {k.lower(): v for k, v in url_map.items()}

    print("--- Starting Database Update ---")
    
    with Session(engine) as session:
        machines = session.exec(select(Machine)).all()
        print(f"Found {len(machines)} machines in database.")
        
        updated_count = 0
        
        for machine in machines:
            # FIX: Use 'name' instead of 'machine_type'
            # We strip whitespace and use the 'name' field from your DB model
            m_name_original = machine.name
            m_name_key = m_name_original.lower().strip() if m_name_original else ""
            
            # 1. Try Direct Match
            if m_name_key in url_map_lower:
                machine.image_url = url_map_lower[m_name_key][0]
                session.add(machine)
                updated_count += 1
            
            # 2. Try Partial Match (e.g., DB="CNC Lathe 01" matches Map="CNC Lathe")
            else:
                found = False
                for map_key, urls in url_map_lower.items():
                    # If the Map Key (e.g., "cnc axle turning lathe") is inside the DB Name
                    if map_key in m_name_key: 
                        machine.image_url = urls[0]
                        session.add(machine)
                        updated_count += 1
                        found = True
                        break
                
                if not found:
                    # Debug print to help you verify what's going wrong if count is 0
                    # print(f"  [Skip] No map key found for DB Machine: '{m_name_original}'")
                    pass

        session.commit()
        print(f"--- Success! Updated {updated_count} machines with images. ---")

if __name__ == "__main__":
    seed_images()