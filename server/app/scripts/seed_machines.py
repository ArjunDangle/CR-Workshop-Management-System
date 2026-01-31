import sys
import os
import csv
from datetime import datetime
from uuid import UUID

# --- 1. System Path Setup ---
# This ensures 'app' can be found regardless of where the script is called from
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.dirname(SCRIPT_DIR)
SERVER_DIR = os.path.dirname(APP_DIR)

if SERVER_DIR not in sys.path:
    sys.path.insert(0, SERVER_DIR)

from sqlmodel import Session, select, SQLModel
from app.core.database import engine, get_db_session
from app.modules.machine.machine_models import (
    Shop, MachineType, Machine, MaintenancePlan, MaintenanceTask
)

# --- 2. Configuration & Helpers ---
ASSETS_CSV = os.path.join(SCRIPT_DIR, "matunga_cr_workshop_machines_dummy_data.csv")
SOP_CSV = os.path.join(SCRIPT_DIR, "machine_sop_table_matunga_cr_with_location.csv")

def parse_date(date_str):
    if not date_str or date_str.lower() == 'nan':
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return None

def parse_bool(val):
    if not val:
        return False
    return str(val).strip().lower() in ["yes", "true", "1"]

# --- 3. Seeding Logic ---

def seed_assets(db: Session):
    print(f"🏭 Phase 1: Processing Assets Registry...")
    
    if not os.path.exists(ASSETS_CSV):
        print(f"❌ Error: File not found at {ASSETS_CSV}")
        return

    # In-memory cache to speed up processing
    shops_cache = {} # {name: id}
    types_cache = {} # {name: id}
    
    with open(ASSETS_CSV, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        machines_added = 0
        
        for row in reader:
            # 1. Handle Shop (Deduplication)
            shop_name = row['shop_name'].strip()
            if shop_name not in shops_cache:
                shop = db.execute(select(Shop).where(Shop.name == shop_name)).scalar_one_or_none()
                if not shop:
                    # Generate a simple code/slug
                    code = "".join([c for c in shop_name if c.isupper()])[:4] or shop_name[:3].upper()
                    shop = Shop(name=shop_name, code=code)
                    db.add(shop)
                    db.flush() # Get the ID
                shops_cache[shop_name] = shop.id

            # 2. Handle Machine Type (Deduplication)
            type_name = row['machine_type'].strip()
            if type_name not in types_cache:
                m_type = db.execute(select(MachineType).where(MachineType.name == type_name)).scalar_one_or_none()
                if not m_type:
                    m_type = MachineType(name=type_name)
                    db.add(m_type)
                    db.flush()
                types_cache[type_name] = m_type.id

            # 3. Create Machine
            asset_id = row['asset_id'].strip()
            existing_machine = db.execute(select(Machine).where(Machine.asset_id == asset_id)).scalar_one_or_none()
            
            if not existing_machine:
                machine = Machine(
                    asset_id=asset_id,
                    name=f"{row['manufacturer']} {row['model_name']}".strip(),
                    status=row.get('status', 'OPERATIONAL').upper(),
                    criticality=row.get('criticality', 'Medium'),
                    last_maintenance_date=parse_date(row.get('last_maintenance_date')),
                    install_year=int(row['install_year']) if row.get('install_year') and row['install_year'].isdigit() else None,
                    shop_id=shops_cache[shop_name],
                    type_id=types_cache[type_name]
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

    plan_cache = {} # {(machine_type_id, frequency): plan_id}
    tasks_added = 0

    with open(SOP_CSV, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            type_name = row['machine_type'].strip()
            frequency = row['frequency'].strip()
            
            # Find the machine type ID
            m_type = db.execute(select(MachineType).where(MachineType.name == type_name)).scalar_one_or_none()
            if not m_type:
                continue # Skip if SOP is for a machine type we don't have in registry

            # 1. Handle Maintenance Plan (Grouped by Type + Frequency)
            plan_key = (m_type.id, frequency)
            if plan_key not in plan_cache:
                plan = db.execute(select(MaintenancePlan).where(
                    MaintenancePlan.machine_type_id == m_type.id,
                    MaintenancePlan.frequency == frequency
                )).scalar_one_or_none()
                
                if not plan:
                    plan = MaintenancePlan(
                        title=f"{frequency} Maintenance Plan",
                        frequency=frequency,
                        machine_type_id=m_type.id
                    )
                    db.add(plan)
                    db.flush()
                plan_cache[plan_key] = plan.id

            # 2. Create Maintenance Task
            task = MaintenanceTask(
                description=row['sop_task'].strip(),
                is_critical=parse_bool(row.get('critical')),
                requires_ppe=parse_bool(row.get('ppe_required')),
                plan_id=plan_cache[plan_key]
            )
            db.add(task)
            tasks_added += 1
            
        db.commit()
        print(f"✅ Created {len(plan_cache)} Maintenance Plans and {tasks_added} SOP Tasks.")

# --- 4. Main Entry Point ---

def main():
    print("🚀 Initializing Machines & Plants Module Seeding...")
    
    # Ensure tables exist (Alembic should have done this, but safe for dev)
    # SQLModel.metadata.create_all(engine)
    
    with get_db_session() as db:
        try:
            seed_assets(db)
            seed_sops(db)
            print("\n🏁 Digital Twin Construction Complete. All assets and SOPs synced.")
        except Exception as e:
            print(f"\n❌ Critical Error during seeding: {e}")
            db.rollback()
            raise e

if __name__ == "__main__":
    main()