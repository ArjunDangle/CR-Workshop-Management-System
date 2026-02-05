import sys
import os
import random
from datetime import datetime, timedelta, date

# ---------------------------------------------------------
# 1. ROBUST PATH SETUP
# ---------------------------------------------------------
# Handles running from 'server/', 'server/app/', or 'server/app/scripts/'
current_dir = os.path.dirname(os.path.abspath(__file__))
server_dir = None

if os.path.basename(current_dir) == "scripts":
    server_dir = os.path.dirname(os.path.dirname(current_dir))
elif os.path.basename(current_dir) == "app":
    server_dir = os.path.dirname(current_dir)
else:
    server_dir = current_dir

if server_dir and server_dir not in sys.path:
    sys.path.insert(0, server_dir)

# ---------------------------------------------------------
# 2. MODEL IMPORTS (With Fallbacks)
# ---------------------------------------------------------
try:
    from sqlmodel import Session, select
    from app.core.database import get_db_session
    
    # Auth & Machine
    try:
        from app.modules.auth.models import User
        from app.modules.machine.machine_models import Machine
    except ImportError:
        from app.models import User, Machine

    # Contractor
    try:
        from app.modules.contractor.models import Contractor, Worker
    except ImportError:
        from app.models import Contractor, Worker

    # Incident
    try:
        from app.modules.incident.models import Incident
    except ImportError:
        from app.models import Incident

except Exception as e:
    print(f"❌ Critical Import Error: {e}")
    sys.exit(1)

# ---------------------------------------------------------
# 3. DATA CONSTANTS & ENUMS
# ---------------------------------------------------------

# Strict Enum Mappings (Based on your Schema)
CONTRACTOR_TYPES = ["OEM", "MSME", "LOCAL"]
WORKER_TRADES = ["ELECTRICIAN", "FITTER", "WELDER", "RIGGER", "HELPER"]
WORKER_SKILLS = ["SKILLED", "SEMI_SKILLED", "UNSKILLED"]
INCIDENT_SEVERITIES = ["MINOR", "MAJOR", "NEAR_MISS", "FATAL"]
INCIDENT_STATUSES = ["OPEN", "CLOSED", "INVESTIGATING"]

CONTRACTORS_DATA = [
    {"name": "Siemens Mobility India", "code": "VN-SIE-01", "type": "OEM", "trade": "ELECTRICIAN"},
    {"name": "Larsen & Toubro Heavy Engg", "code": "VN-LNT-04", "type": "OEM", "trade": "FITTER"},
    {"name": "R.K. Engineering Works", "code": "VN-RKE-22", "type": "LOCAL", "trade": "WELDER"},
    {"name": "Apex Electrical Solutions", "code": "VN-APX-99", "type": "LOCAL", "trade": "ELECTRICIAN"},
    {"name": "Star Manpower Services", "code": "VN-SMS-101", "type": "MSME", "trade": "HELPER"},
    {"name": "Global Tech Engineering", "code": "VN-GTE-55", "type": "MSME", "trade": "FITTER"}
]

FIRST_NAMES = ["Rajesh", "Suresh", "Amit", "Rahul", "Vijay", "Anil", "Sunil", "Dinesh", "Karthik", "Arjun", "Ravi", "Santosh", "Vikram", "Manoj", "Deepak"]
LAST_NAMES = ["Kumar", "Singh", "Sharma", "Patil", "Gupta", "Khan", "Yadav", "Mishra", "Reddy", "Nair", "Verma", "Jha", "Chavan", "Das", "More"]

INCIDENT_SCENARIOS = [
    ("Oil spill near Pit Line", "NEAR_MISS", "Slippery floor detected during shift change."),
    ("Minor cut during grinding", "MINOR", "Worker sustained minor cut. First aid provided."),
    ("Cable trip hazard", "NEAR_MISS", "Loose cables found on main walkway."),
    ("Scaffolding unstable", "MAJOR", "Work stopped immediately due to loose clamps."),
    ("Welding spark in non-designated area", "MINOR", "Fire watch alerted. Hot work stopped.")
]

# ---------------------------------------------------------
# 4. SEEDING FUNCTIONS
# ---------------------------------------------------------

def seed_authentic_data():
    print("🚀 Initializing Authentic Data Seeding...")
    
    with get_db_session() as db:
        try:
            # --- 0. PRE-CHECKS ---
            machines = db.execute(select(Machine)).scalars().all()
            if not machines:
                print("⚠️  No Machines found. Skipping Incidents.")
            
            admin = db.execute(select(User)).scalars().first()

            # --- 1. CONTRACTORS ---
            print(f"1️⃣  Onboarding {len(CONTRACTORS_DATA)} Contractors...")
            created_contractors = []
            
            for c_data in CONTRACTORS_DATA:
                existing = db.execute(select(Contractor).where(Contractor.vendor_code == c_data["code"])).scalars().first()
                
                if not existing:
                    contractor = Contractor(
                        company_name=c_data["name"],     # Correct field: company_name
                        vendor_code=c_data["code"],      # Correct field: vendor_code
                        contractor_type=c_data["type"],  # Enum: OEM/MSME/LOCAL
                        status="ACTIVE",
                        safety_rating=random.randint(70, 100),
                        contact_person=f"Mr. {random.choice(LAST_NAMES)}",
                        email=f"contact@{c_data['code'].lower().replace('-', '')}.com",
                        phone=f"9{random.randint(100000000, 999999999)}",
                        empanelment_valid_upto=date.today() + timedelta(days=365),
                        insurance_valid_upto=date.today() + timedelta(days=180),
                        insurance_policy_no=f"POL-{random.randint(10000, 99999)}"
                    )
                    db.add(contractor)
                    db.flush()
                    created_contractors.append(contractor)
                else:
                    created_contractors.append(existing)

            # --- 2. WORKERS ---
            print("2️⃣  Mobilizing Labor Force...")
            workers_count = 0
            
            for contractor in created_contractors:
                # Add 5-8 workers per contractor
                for _ in range(random.randint(5, 8)):
                    full_name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
                    
                    # Generate ID Proof (CRITICAL FIX: This was missing before)
                    id_proof = f"GP-{contractor.vendor_code.split('-')[1]}-{random.randint(1000, 9999)}"
                    
                    # Determine Trade/Skill based on Contractor Profile
                    # (Simple logic: OEM -> Skilled, LOCAL -> Semi/Unskilled)
                    if contractor.contractor_type == "OEM":
                        skill = "SKILLED"
                        trade = random.choice(["ELECTRICIAN", "FITTER", "WELDER"])
                    else:
                        skill = random.choice(["SEMI_SKILLED", "UNSKILLED"])
                        trade = random.choice(["HELPER", "RIGGER", "FITTER"])

                    # Check existence
                    exists = db.execute(select(Worker).where(Worker.id_proof_number == id_proof)).scalars().first()
                    
                    if not exists:
                        worker = Worker(
                            full_name=full_name,
                            contractor_id=contractor.id,
                            id_proof_number=id_proof,      # <-- THE FIX
                            skill_category=skill,          # Enum: SKILLED/UNSKILLED
                            trade=trade,                   # Enum: FITTER/HELPER...
                            is_blacklisted=False,
                            medical_valid_upto=date.today() + timedelta(days=random.randint(30, 300)),
                            safety_training_valid_upto=date.today() + timedelta(days=random.randint(60, 365))
                        )
                        db.add(worker)
                        workers_count += 1
            
            db.flush() 

            # --- 3. INCIDENTS ---
            print("3️⃣  Logging Safety Incidents...")
            incidents_count = 0
            
            if machines:
                for i, (title, severity, desc) in enumerate(INCIDENT_SCENARIOS):
                    # Generate Unique Code
                    inc_code = f"INC-2026-{random.randint(100, 999)}"
                    
                    exists = db.execute(select(Incident).where(Incident.incident_code == inc_code)).scalars().first()
                    
                    if not exists:
                        machine = random.choice(machines)
                        contractor = random.choice(created_contractors)
                        
                        incident = Incident(
                            incident_code=inc_code,          # Mandatory field
                            title=title,
                            description=desc,
                            severity=severity,               # Enum: MINOR/MAJOR...
                            status="CLOSED",                 # Enum
                            machine_id=machine.id,
                            contractor_id=contractor.id,
                            reported_by_id=admin.id if admin else None,
                            location_details=f"Bay {random.randint(1, 6)}", # Correct field name
                            occurred_at=datetime.now() - timedelta(days=random.randint(1, 60)) # Correct field name
                        )
                        db.add(incident)
                        incidents_count += 1

            db.commit()
            print(f"\n✅ SUCCESS! Database Populated:")
            print(f"   - {len(created_contractors)} Contractors")
            print(f"   - {workers_count} Workers (With ID Proofs)")
            print(f"   - {incidents_count} Incidents")

        except Exception as e:
            print(f"\n❌ ERROR during seeding: {e}")
            db.rollback()
            raise e

if __name__ == "__main__":
    seed_authentic_data()