import sys
import os
import pandas as pd
from sqlmodel import Session, select

# --- Path Setup ---
current_dir = os.path.dirname(os.path.abspath(__file__))
server_dir = os.path.abspath(os.path.join(current_dir, "../../"))
if server_dir not in sys.path:
    sys.path.append(server_dir)

from app.core.database import engine

# --- Register Models to prevent Mapper Errors ---
import app.models 
from app.modules.incident.models import Incident
from app.modules.machine.machine_models import Machine, MaintenancePlan
from app.modules.contractor.models import Contractor, Worker 

CSV_PATH = "/Users/arjundangle/Arjun/CR-Workshop-Management-System/server/app/scripts/matunga_cr_workshop_machines_dummy_data.csv"

def import_images_to_db():
    if not os.path.exists(CSV_PATH):
        print(f"❌ Error: CSV not found")
        return
    
    df = pd.read_csv(CSV_PATH)
    df_with_urls = df[df['image_url'].notna()]
    print(f"Found {len(df_with_urls)} image URLs to import.")

    updated_count = 0
    not_found_count = 0

    with Session(engine) as session:
        for _, row in df_with_urls.iterrows():
            # Use the actual column from your CSV headers
            csv_asset_id = str(row['asset_id']).strip()
            
            # Match by the 'asset_id' field in the Machine model
            statement = select(Machine).where(Machine.asset_id == csv_asset_id)
            db_machine = session.exec(statement).first()

            if db_machine:
                db_machine.image_url = str(row['image_url']).strip()
                session.add(db_machine)
                updated_count += 1
            else:
                # Fallback: Try matching the 'name' field if asset_id is stored there
                statement_alt = select(Machine).where(Machine.name == csv_asset_id)
                db_machine_alt = session.exec(statement_alt).first()
                if db_machine_alt:
                    db_machine_alt.image_url = str(row['image_url']).strip()
                    session.add(db_machine_alt)
                    updated_count += 1
                else:
                    not_found_count += 1

        session.commit()
    
    print(f"\n--- Import Complete ---")
    print(f"✅ Successfully updated: {updated_count} machines")
    print(f"⚠️  Not found in DB: {not_found_count}")

if __name__ == "__main__":
    import_images_to_db()