import sys
import os
import csv
from datetime import datetime

# 1. SETUP PATHS (Robust Mode)
# ---------------------------------------------------------
CURRENT_WD = os.getcwd()
SERVER_DIR = CURRENT_WD 

# If running from inside scripts folder, go up two levels
if os.path.basename(CURRENT_WD) == "scripts":
    SERVER_DIR = os.path.dirname(os.path.dirname(CURRENT_WD))
elif os.path.basename(CURRENT_WD) == "app":
    SERVER_DIR = os.path.dirname(CURRENT_WD)

if SERVER_DIR not in sys.path:
    sys.path.insert(0, SERVER_DIR)

# 2. IMPORT MODELS
# ---------------------------------------------------------
try:
    from sqlmodel import Session, select
    from app.core.database import get_db_session
    
    # --- REGISTRY WARM-UP (Prevents "Relationship" crashes) ---
    # We load these so Machine knows what 'Incident' and 'Permit' are
    try:
        from app.models import Permit
    except ImportError:
        try:
            from app.modules.permit.models import Permit
        except ImportError:
            pass

    try:
        from app.modules.incident.models import Incident
    except ImportError:
        pass

    try:
        from app.modules.contractor.models import Contractor
    except ImportError:
        pass

    # --- MAIN MODEL IMPORTS ---
    try:
        from app.modules.machine.machine_models import (
            Shop, MachineType, Machine, MaintenancePlan, MaintenanceTask
        )
    except ImportError:
        from app.models import Shop, MachineType, Machine, MaintenancePlan, MaintenanceTask

except Exception as e:
    print(f"❌ Import Error: {e}")
    sys.exit(1)

# 3. CONFIGURATION
# ---------------------------------------------------------
# Locate CSVs relative to the script file location
SCRIPT_FILE_DIR = os.path.dirname(os.path.abspath(__file__))
ASSETS_CSV = os.path.join(SCRIPT_FILE_DIR, "matunga_cr_workshop_machines_dummy_data.csv")
SOP_CSV = os.path.join(SCRIPT_FILE_DIR, "machine_sop_table_matunga_cr_with_location.csv")

def parse_date(date_str):
    if not date_str or date_str.lower() == 'nan':
        return None
    try:
        # Try DD-MM-YYYY (Common in your CSV)
        return datetime.strptime(date_str, "%d-%m-%Y").date()
    except ValueError:
        try:
            # Fallback to YYYY-MM-DD
            return datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return None

def parse_bool(val):
    if not val:
        return False
    return str(val).strip().lower() in ["yes", "true", "1"]

# 4. SEEDING LOGIC
# ---------------------------------------------------------

def seed_assets(db: Session):
    print(f"🏭 Phase 1: Processing Assets Registry...")
    print(f"   (Reading from: {ASSETS_CSV})")
    
    if not os.path.exists(ASSETS_CSV):
        print(f"❌ Error: File not found at {ASSETS_CSV}")
        return

    shops_cache = {} 
    types_cache = {}
    machines_added = 0
    
    with open(ASSETS_CSV, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            # 1. Handle Shop (With your original Code Generation logic)
            shop_name = row.get('shop_name', '').strip()
            if not shop_name: continue

            if shop_name not in shops_cache:
                shop = db.execute(select(Shop).where(Shop.name == shop_name)).scalars().first()
                if not shop:
                    # Your Logic: Generate code from Uppercase letters or first 3 chars
                    code = "".join([c for c in shop_name if c.isupper()])[:4] 
                    if not code:
                        code = shop_name[:3].upper()
                    
                    shop = Shop(name=shop_name, code=code, location="Matunga Workshop")
                    db.add(shop)
                    db.flush()
                shops_cache[shop_name] = shop.id

            # 2. Handle Machine Type
            type_name = row.get('machine_type', '').strip()
            if not type_name: continue

            if type_name not in types_cache:
                m_type = db.execute(select(MachineType).where(MachineType.name == type_name)).scalars().first()
                if not m_type:
                    m_type = MachineType(name=type_name)
                    db.add(m_type)
                    db.flush()
                types_cache[type_name] = m_type.id

            # 3. Create Machine
            asset_id = row.get('asset_id', '').strip()
            existing = db.execute(select(Machine).where(Machine.asset_id == asset_id)).scalars().first()
            
            if not existing:
                # Handle install year safely
                install_year_raw = row.get('install_year')
                install_year = int(install_year_raw) if install_year_raw and install_year_raw.isdigit() else 2020

                machine = Machine(
                    asset_id=asset_id,
                    name=row.get('model_name', '').strip(), # Map model_name to name
                    status=row.get('status', 'OPERATIONAL').upper(),
                    
                    # YOUR ORIGINAL FALLBACK LOGIC
                    criticality=row.get('criticality', 'Medium'),
                    
                    last_maintenance_date=parse_date(row.get('last_maintenance_date')),
                    install_year=install_year,
                    shop_id=shops_cache[shop_name],
                    type_id=types_cache[type_name], # DB expects 'type_id'
                    
                    # Defaults for new schema fields
                    is_safety_locked=False
                )
                db.add(machine)
                machines_added += 1
        
        db.commit()
        print(f"✅ Created {len(shops_cache)} Shops, {len(types_cache)} Machine Types, and {machines_added} Machines.")

def seed_sops(db: Session):
    print(f"\n📘 Phase 2: Processing Maintenance SOPs...")
    
    if not os.path.exists(SOP_CSV):
        print(f"❌ Error: File not found at {SOP_CSV}")
        return

    plan_cache = {} 
    tasks_added = 0

    with open(SOP_CSV, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            type_name = row.get('machine_type', '').strip()
            if not type_name: continue

            # Ensure Machine Type Exists
            m_type = db.execute(select(MachineType).where(MachineType.name == type_name)).scalars().first()
            if not m_type:
                # If SOP exists for a machine we don't have yet, create the type
                m_type = MachineType(name=type_name)
                db.add(m_type)
                db.flush()

            # 1. Handle Maintenance Plan
            frequency = row.get('frequency', 'Monthly').strip()
            plan_key = (m_type.id, frequency)
            
            if plan_key not in plan_cache:
                plan = db.execute(select(MaintenancePlan).where(
                    MaintenancePlan.machine_type_id == m_type.id,
                    MaintenancePlan.frequency == frequency
                )).scalars().first()
                
                if not plan:
                    plan = MaintenancePlan(
                        title=f"{frequency} Maintenance Plan",
                        frequency=frequency,
                        machine_type_id=m_type.id
                    )
                    db.add(plan)
                    db.flush()
                plan_cache[plan_key] = plan.id

            # 2. Create Task (Handling column name variations)
            def get_val(keys):
                for k in keys:
                    if row.get(k): return row.get(k)
                return None

            is_crit = parse_bool(get_val(['critical', 'critical_task']))
            requires_ppe = parse_bool(get_val(['ppe_required', 'ppe']))

            task = MaintenanceTask(
                description=row.get('sop_task', '').strip(),
                is_critical=is_crit,
                requires_ppe=requires_ppe,
                plan_id=plan_cache[plan_key]
            )
            db.add(task)
            tasks_added += 1
            
        db.commit()
        print(f"✅ Created {len(plan_cache)} Maintenance Plans and {tasks_added} SOP Tasks.")

# 5. MAIN ENTRY
# ---------------------------------------------------------
def main():
    print("🚀 Initializing Machines & Plants Module Seeding...")
    
    with get_db_session() as db:
        try:
            seed_assets(db)
            seed_sops(db)
            print("\n🏁 Digital Twin Construction Complete. All assets and SOPs synced.")
        except Exception as e:
            print(f"\n❌ Critical Error during seeding: {e}")
            db.rollback()

if __name__ == "__main__":
    main()