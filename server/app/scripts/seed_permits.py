"""
Seed Script to populate the database with Indian-context Permits for Demo.
Usage: 
    python seed_permits.py
"""
import sys
import os
import random
from datetime import datetime, timedelta, timezone
from uuid import uuid4


current_dir = os.path.dirname(os.path.abspath(__file__)) # scripts folder
server_dir = os.path.abspath(os.path.join(current_dir, "../../")) # server folder
# Add the parent directory to sys.path so we can import from 'app'
if server_dir not in sys.path:
    sys.path.append(server_dir)

from sqlmodel import Session, select
from app.core.database import engine
from app.models import User, Permit, PermitPPE, PermitAttendee, PermitWorkerLink
from app.modules.contractor.models import Contractor, Worker
from app.modules.machine.machine_models import Machine
from app.modules.incident.models import Incident  # Fixes "NameError: Incident"
from app.modules.machine.machine_models import MaintenancePlan, MaintenanceTask # Ensuring all are registered
# -------------------------------------------------------

from app.modules.contractor.models import Contractor, Worker
from app.modules.machine.machine_models import Machine

def seed_permits():
    with Session(engine) as db:
        print("--- STARTING INDIAN PERMIT SEED ---")

        # 1. FETCH PREREQUISITES
        users = db.exec(select(User)).all()
        machines = db.exec(select(Machine)).all()
        contractors = db.exec(select(Contractor)).all()

        if not users or not machines or not contractors:
            print("❌ ERROR: Ensure Users, Machines, and Contractors exist in DB first.")
            return

        # 2. DEFINING INDIAN SCENARIOS
        scenarios = [
            {"status": "Active", "type": "Electrical", "desc": "Main Switchgear Maintenance - Parel Shop", "days_offset": 0, "critical": True},
            {"status": "Active", "type": "Height", "desc": "EOT Crane Gantry Repair - Matunga Yard", "days_offset": 0, "critical": False},
            {"status": "Pending Authorization", "type": "Electrical", "desc": "Replacement of 11kV Transformers", "days_offset": 1, "critical": True},
            {"status": "Pending Authorization", "type": "Height", "desc": "Shed Roof Sheet Replacement", "days_offset": 2, "critical": False},
            {"status": "Pending Approval", "type": "Electrical", "desc": "Workshop Lighting Circuit Overhaul", "days_offset": 1, "critical": False},
            {"status": "Pending Approval", "type": "Height", "desc": "High-Mast Tower Lamp Replacement", "days_offset": 3, "critical": True},
            {"status": "Closed", "type": "Electrical", "desc": "Distribution Board Wiring Fix", "days_offset": -5, "critical": False},
            {"status": "Closed", "type": "Height", "desc": "Painting of Overhead Water Tank", "days_offset": -2, "critical": False}
        ]

        # Indian Names for Attendees
        indian_names = [
            "Rajesh Kumar", "Sanjay Deshmukh", "Arjun Patil", "Amit Sharma", 
            "Vikram Singh", "Prakash Jadhav", "Suresh Nair", "Deepak Gupta",
            "Vijay Chauhan", "Manoj Tiwari", "Anil Kulkarni", "Ramesh Pawar"
        ]

        # 3. CREATE PERMITS
        for i, scenario in enumerate(scenarios):
            permittee = random.choice(users)
            authorizer = random.choice(users)
            approver = random.choice(users)
            machine = random.choice(machines)
            contractor = random.choice(contractors)
            
            workers = db.exec(select(Worker).where(Worker.contractor_id == contractor.id)).all()
            assigned_workers = workers[:2] if len(workers) >= 2 else workers

            base_date = datetime.now(timezone.utc) + timedelta(days=scenario["days_offset"])
            start_dt = base_date.replace(hour=9, minute=0)
            end_dt = base_date.replace(hour=17, minute=0)

            permit = Permit(
                id=uuid4(),
                permit_no=f"CR-WRK-{2026}-{1000+i}",
                permit_type=scenario["type"],
                status=scenario["status"],
                work_description=scenario["desc"],
                work_location=f"{machine.shop_id} - {machine.name}",
                person_responsible=permittee.full_name,
                date=base_date.date(),
                start_date=start_dt.date(),
                start_time=start_dt.time(),
                finish_date=end_dt.date(),
                finish_time=end_dt.time(),
                permittee_id=permittee.id,
                machine_id=machine.id,
                contractor_id=contractor.id,
                is_critical=scenario["critical"],
                electrical_isolation_obtained="yes" if scenario["type"] == "Electrical" else "no"
            )

            # Workflow logic for specific statuses
            if scenario["status"] in ["Pending Approval", "Approved", "Active", "Closed"]:
                permit.authorizer_id = authorizer.id
                permit.authorized_at = datetime.now(timezone.utc) - timedelta(hours=4)
                permit.authorizer_name = authorizer.full_name
            
            if scenario["status"] in ["Approved", "Active", "Closed"]:
                permit.approver_id = approver.id
                permit.approved_at = datetime.now(timezone.utc) - timedelta(hours=2)
                permit.approver_remarks = "All safety protocols verified on-site."

            db.add(permit)
            db.commit()

            # 4. ADD RELATED DATA
            # PPEs
            db.add_all([
                PermitPPE(permit_id=permit.id, name="Safety Helmet", checked=True),
                PermitPPE(permit_id=permit.id, name="Safety Shoes", checked=True)
            ])

            # Attendees (Indian Names)
            names_pool = random.sample(indian_names, 3)
            db.add_all([
                PermitAttendee(permit_id=permit.id, name=names_pool[0], phone="9876543210"),
                PermitAttendee(permit_id=permit.id, name=names_pool[1], phone="9820011223")
            ])

            # Workers
            for w in assigned_workers:
                db.add(PermitWorkerLink(permit_id=permit.id, worker_id=w.id, role="Lead Technician"))

            db.commit()
            print(f"✅ Created {scenario['status']} {scenario['type']} Permit: {permit.permit_no}")

        print("--- INDIAN CONTEXT SEED COMPLETE ---")

if __name__ == "__main__":
    seed_permits()