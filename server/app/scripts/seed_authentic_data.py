import sys
import os
import random
from datetime import date, timedelta, datetime

# ---------------------------------------------------------
# PATH SETUP
# ---------------------------------------------------------
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(os.path.dirname(current_dir)) # Points to 'server'
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from sqlmodel import Session, select
from app.core.database import engine

# ---------------------------------------------------------
# HYBRID IMPORTS (The Critical Fix)
# ---------------------------------------------------------
try:
    # 1. LEGACY MODULES (Auth, Machine, Permit) -> live in app.models
    from app.models import User, Machine
    print("✅ Loaded Legacy Models (User, Machine) from app.models")
except ImportError:
    # Fallback: Try modular path just in case
    try:
        from app.modules.auth.models import User
        from app.modules.machine.models import Machine
    except ImportError:
        print("❌ CRITICAL: Could not find User or Machine models.")
        print("   checked: app.models AND app.modules.*.models")
        sys.exit(1)

# 2. NEW MODULES (Contractor, Incident) -> live in their own folders
try:
    from app.modules.contractor.models import (
        Contractor, Worker, ContractorStatus, ContractorType, WorkerSkill, WorkerTrade
    )
    from app.modules.incident.models import (
        Incident, IncidentSeverity, IncidentStatus, IncidentVictim
    )
    print("✅ Loaded New Models (Contractor, Incident) from app.modules")
except ImportError as e:
    print(f"❌ CRITICAL: Could not find New Modules. Error: {e}")
    sys.exit(1)


# --- DATA GENERATORS ---
FIRST_NAMES = [
    "Rajesh", "Suresh", "Amit", "Rahul", "Mohammed", "Vijay", "Anil", "Sunil", "Dinesh", 
    "Karthik", "Arjun", "Ravi", "Santosh", "Vikram", "Manoj", "Deepak", "Sanjay", 
    "Vinod", "Praveen", "Rakesh", "Abdul", "Joseph", "David", "Krishna", "Ram"
]
LAST_NAMES = [
    "Kumar", "Singh", "Sharma", "Patil", "Gupta", "Khan", "Yadav", "Mishra", "Reddy", 
    "Nair", "Verma", "Jha", "Chavan", "Das", "Naik", "Sheikh", "Fernandes", "More"
]

def generate_indian_name():
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"

def seed_authentic_data():
    print("\n🚂 POPULATING RAILWAY WORKSHOP WITH AUTHENTIC DATA...")
    
    with Session(engine) as db:
        # Get Admin context
        admin_user = db.exec(select(User)).first()
        if not admin_user:
            print("⚠️  Warning: No Admin User found. Incidents will be anonymous.")

        # Get Machines
        machines = db.exec(select(Machine)).all()
        if not machines:
            print("❌ ERROR: No machines found in DB. Please run your machine seed script first.")
            return

        # ---------------------------------------------------------
        # 1. CREATE CONTRACTORS (Real Companies)
        # ---------------------------------------------------------
        print("1️⃣  Onboarding Contractors...")
        
        contractors_data = [
            {"name": "Siemens Mobility India Pvt Ltd", "code": "VN-SIE-MUM-01", "type": ContractorType.OEM, "status": ContractorStatus.ACTIVE},
            {"name": "Larsen & Toubro (L&T) Heavy Engg", "code": "VN-LNT-CONST-04", "type": ContractorType.OEM, "status": ContractorStatus.ACTIVE},
            {"name": "R.K. Engineering Works", "code": "VN-RKE-LOC-22", "type": ContractorType.LOCAL, "status": ContractorStatus.ACTIVE},
            {"name": "Apex Electrical Solutions", "code": "VN-APX-ELEC-99", "type": ContractorType.LOCAL, "status": ContractorStatus.SUSPENDED},
            {"name": "Star Manpower Services", "code": "VN-SMS-HR-101", "type": ContractorType.MSME, "status": ContractorStatus.ACTIVE}
        ]

        created_contractors = []
        for c in contractors_data:
            existing = db.exec(select(Contractor).where(Contractor.vendor_code == c["code"])).first()
            if not existing:
                new_contractor = Contractor(
                    company_name=c["name"],
                    vendor_code=c["code"],
                    contractor_type=c["type"],
                    status=c["status"],
                    safety_rating=random.randint(70, 100),
                    empanelment_valid_upto=date.today() + timedelta(days=random.randint(100, 700)),
                    insurance_valid_upto=date.today() + timedelta(days=random.randint(50, 400)),
                    insurance_policy_no=f"POL-{random.randint(10000, 99999)}-GEN"
                )
                db.add(new_contractor)
                created_contractors.append(new_contractor)
            else:
                created_contractors.append(existing)
        
        db.commit()
        for c in created_contractors: db.refresh(c)

        # ---------------------------------------------------------
        # 2. CREATE LABOR FORCE (50 Workers)
        # ---------------------------------------------------------
        print("2️⃣  Mobilizing Labor Force (50 Workers)...")
        
        trades = list(WorkerTrade)
        skills = list(WorkerSkill)
        workers_created = 0
        
        for i in range(50):
            employer = random.choice(created_contractors)
            # 10% chance of expired medicals
            is_compliant = random.random() > 0.1
            
            medical_date = date.today() + timedelta(days=random.randint(30, 365)) if is_compliant \
                           else date.today() - timedelta(days=random.randint(1, 20))
            
            gate_pass = f"GP-{employer.vendor_code.split('-')[1]}-{random.randint(1000, 9999)}"
            
            existing_worker = db.exec(select(Worker).where(Worker.id_proof_number == gate_pass)).first()
            if not existing_worker:
                worker = Worker(
                    full_name=generate_indian_name(),
                    contractor_id=employer.id,
                    id_proof_number=gate_pass,
                    skill_category=random.choice(skills),
                    trade=random.choice(trades),
                    is_blacklisted=False,
                    medical_valid_upto=medical_date,
                    safety_training_valid_upto=date.today() + timedelta(days=random.randint(30, 365)),
                    photo_url=None
                )
                db.add(worker)
                workers_created += 1

        db.commit()

        # ---------------------------------------------------------
        # 3. CREATE INCIDENT LOGS (History)
        # ---------------------------------------------------------
        print("3️⃣  Populating Safety Logs...")
        
        incident_scenarios = [
            ("Oil spill near Pit Line", IncidentSeverity.NEAR_MISS, "Slippery floor detected."),
            ("Minor cut during grinding", IncidentSeverity.MINOR, "Worker ignored PPE gloves."),
            ("Cable trip hazard", IncidentSeverity.NEAR_MISS, "Loose cables on walkway."),
            ("Scaffolding unstable", IncidentSeverity.MAJOR, "Work stopped immediately."),
            ("Welding spark in non-designated area", IncidentSeverity.MINOR, "Fire watch alerted.")
        ]

        for i, (title, severity, desc) in enumerate(incident_scenarios):
            machine = random.choice(machines)
            contractor = random.choice(created_contractors)
            
            # Check if incident exists
            code = f"INC-2026-{i+100:03d}"
            existing_inc = db.exec(select(Incident).where(Incident.incident_code == code)).first()
            
            if not existing_inc:
                inc = Incident(
                    incident_code=code,
                    machine_id=machine.id,
                    contractor_id=contractor.id,
                    reported_by_id=admin_user.id if admin_user else None,
                    severity=severity,
                    title=title,
                    description=desc,
                    location_details=f"Bay {random.randint(1, 6)}",
                    occurred_at=datetime.now() - timedelta(days=random.randint(1, 90)),
                    status=IncidentStatus.CLOSED
                )
                db.add(inc)

        db.commit()
        print(f"\n✅ DATABASE POPULATED SUCCESSFULLY!")
        print(f"   - {len(created_contractors)} Contractors Active")
        print(f"   - {workers_created} New Workers Onboarded")
        print(f"   - Safety Incidents Logged")

if __name__ == "__main__":
    try:
        seed_authentic_data()
    except Exception as e:
        print(f"❌ Error: {e}")