import sys
import os
from sqlalchemy import inspect

# 1. Setup Path (The Fix)
# We need to go up TWO levels (scripts -> app -> server) so Python can see "app"
current_dir = os.path.dirname(os.path.abspath(__file__))
server_dir = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(server_dir)

from sqlmodel import SQLModel
from app.core.database import engine

# ---------------------------------------------------------
# 2. IMPORT ALL MODELS (Mapped to your new codebase)
# ---------------------------------------------------------

def import_models():
    print("📥 Loading Models for Schema Creation...")

    # A. CORE & AUTH (Legacy)
    try:
        from app.models import User, Role
        print("   ✅ Auth Models (User, Role) loaded.")
    except ImportError as e:
        print(f"   ⚠️ Warning: Auth models import failed: {e}")

    # B. MACHINE MODULE (Fixed Import Path)
    try:
        from app.modules.machine.machine_models import (
            Machine, Shop, MachineType, MaintenancePlan, MaintenanceTask
        )
        print("   ✅ Machine Module (Machine, Shop, Types, SOPs) loaded.")
    except ImportError as e:
        print(f"   ❌ ERROR: Could not load Machine Module: {e}")

    # C. PERMIT MODULE (Legacy)
    try:
        from app.models import Permit, PermitWorkerLink
        print("   ✅ Permit Module loaded.")
    except ImportError as e:
        print(f"   ⚠️ Permit Module warning: {e}")

    # D. CONTRACTOR MODULE
    try:
        from app.modules.contractor.models import Contractor, Worker, ContractorAudit
        print("   ✅ Contractor Module loaded.")
    except ImportError:
        print("   ⚠️ Contractor Module not found.")

    # E. INCIDENT MODULE
    try:
        from app.modules.incident.models import Incident, IncidentVictim, Investigation, CAPA
        print("   ✅ Incident Module loaded.")
    except ImportError:
        print("   ⚠️ Incident Module not found.")

    # F. COMMON (Notifications/Logs)
    try:
        from app.core.common_models import Notification, ActionLog, FileAttachment
        print("   ✅ Common Models loaded.")
    except ImportError:
        print("   ⚠️ Common Models not found.")

def setup_db():
    print("\n🚀 STARTING DATABASE SCHEMA INITIALIZATION...")
    
    # 1. Load Models to populate SQLModel.metadata
    import_models()

    # 2. Create Tables
    print("\n🛠️  Executing CREATE TABLE queries...")
    try:
        SQLModel.metadata.create_all(engine)
        print("\n✅ SUCCESS: Schema creation command executed.")
        
        # 3. VERIFICATION STEP
        print("\n🔎 Verifying created tables in database...")
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        if tables:
            print(f"   🎉 Found {len(tables)} tables:")
            for table in sorted(tables):
                print(f"      - {table}")
        else:
            print("   ⚠️  WARNING: No tables found! Something went wrong.")

    except Exception as e:
        print(f"\n❌ FATAL ERROR: {e}")

if __name__ == "__main__":
    setup_db()