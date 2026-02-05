import sys
import os
from sqlalchemy import text

# Boilerplate to allow importing from 'app'
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import engine

def update_schema():
    print("🛠️  STARTING DATABASE SCHEMA UPDATE...")
    print("---------------------------------------")
    
    with engine.connect() as conn:
        conn.begin() # Start Transaction
        try:
            # ==========================================
            # 1. CREATE CONTRACTOR MODULE TABLES
            # ==========================================
            print("1️⃣  Creating Contractor Tables...")
            
            # Contractor Table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS contractor (
                    id UUID PRIMARY KEY,
                    company_name VARCHAR NOT NULL UNIQUE,
                    vendor_code VARCHAR NOT NULL UNIQUE,
                    status VARCHAR NOT NULL,
                    contractor_type VARCHAR NOT NULL,
                    safety_rating INTEGER DEFAULT 100,
                    empanelment_valid_upto DATE NOT NULL,
                    insurance_policy_no VARCHAR,
                    insurance_valid_upto DATE,
                    created_at TIMESTAMP DEFAULT now()
                );
            """))

            # Worker Table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS worker (
                    id UUID PRIMARY KEY,
                    contractor_id UUID NOT NULL,
                    full_name VARCHAR NOT NULL,
                    id_proof_number VARCHAR NOT NULL UNIQUE,
                    skill_category VARCHAR NOT NULL,
                    trade VARCHAR NOT NULL,
                    is_blacklisted BOOLEAN DEFAULT FALSE,
                    medical_valid_upto DATE NOT NULL,
                    safety_training_valid_upto DATE NOT NULL,
                    photo_url VARCHAR,
                    FOREIGN KEY (contractor_id) REFERENCES contractor(id)
                );
            """))

            # Contractor Audit Table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS contractoraudit (
                    id UUID PRIMARY KEY,
                    contractor_id UUID NOT NULL,
                    action VARCHAR NOT NULL,
                    old_value VARCHAR,
                    new_value VARCHAR,
                    changed_by VARCHAR,
                    timestamp TIMESTAMP DEFAULT now()
                );
            """))

            # ==========================================
            # 2. UPDATE PERMIT MODULE
            # ==========================================
            print("2️⃣  Updating Permit Table...")
            
            # Add contractor_id to Permit if missing
            try:
                conn.execute(text("ALTER TABLE permit ADD COLUMN contractor_id UUID;"))
                conn.execute(text("ALTER TABLE permit ADD CONSTRAINT fk_permit_contractor FOREIGN KEY (contractor_id) REFERENCES contractor(id);"))
                print("   - Added contractor_id column.")
            except Exception:
                print("   - contractor_id already exists (Skipping).")

            # Permit-Worker Link Table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS permitworkerlink (
                    permit_id UUID NOT NULL,
                    worker_id UUID NOT NULL,
                    role VARCHAR NOT NULL,
                    PRIMARY KEY (permit_id, worker_id),
                    FOREIGN KEY (permit_id) REFERENCES permit(id),
                    FOREIGN KEY (worker_id) REFERENCES worker(id)
                );
            """))

            # ==========================================
            # 3. CREATE INCIDENT MODULE TABLES
            # ==========================================
            print("3️⃣  Creating Incident Tables...")

            # Incident Table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS incident (
                    id UUID PRIMARY KEY,
                    incident_code VARCHAR UNIQUE,
                    permit_id UUID,
                    machine_id UUID,
                    contractor_id UUID,
                    reported_by_id UUID,
                    severity VARCHAR NOT NULL,
                    title VARCHAR,
                    description TEXT,
                    location_details VARCHAR,
                    occurred_at TIMESTAMP NOT NULL,
                    reported_at TIMESTAMP DEFAULT now(),
                    status VARCHAR NOT NULL,
                    is_work_stopped BOOLEAN DEFAULT FALSE,
                    photos VARCHAR,
                    FOREIGN KEY (permit_id) REFERENCES permit(id),
                    FOREIGN KEY (machine_id) REFERENCES machine(id),
                    FOREIGN KEY (contractor_id) REFERENCES contractor(id)
                );
            """))

            # Incident Victim Table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS incidentvictim (
                    id UUID PRIMARY KEY,
                    incident_id UUID NOT NULL,
                    worker_id UUID,
                    full_name VARCHAR NOT NULL,
                    injury_details VARCHAR,
                    hospitalized BOOLEAN DEFAULT FALSE,
                    FOREIGN KEY (incident_id) REFERENCES incident(id),
                    FOREIGN KEY (worker_id) REFERENCES worker(id)
                );
            """))

            # Investigation Table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS investigation (
                    id UUID PRIMARY KEY,
                    incident_id UUID NOT NULL UNIQUE,
                    investigated_by_id UUID,
                    started_at TIMESTAMP,
                    completed_at TIMESTAMP,
                    root_cause_category VARCHAR,
                    root_cause_analysis TEXT,
                    witness_statements TEXT,
                    conclusion TEXT,
                    evidence_photos_url VARCHAR,
                    FOREIGN KEY (incident_id) REFERENCES incident(id)
                );
            """))

            # CAPA Table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS capa (
                    id UUID PRIMARY KEY,
                    incident_id UUID NOT NULL,
                    action_description VARCHAR NOT NULL,
                    assigned_to_id UUID,
                    deadline DATE,
                    completed_at TIMESTAMP,
                    is_completed BOOLEAN DEFAULT FALSE,
                    remarks VARCHAR,
                    FOREIGN KEY (incident_id) REFERENCES incident(id)
                );
            """))

            conn.commit()
            print("\n✅ SUCCESS: Database Schema is now synced with Module 5 Codebase.")
        
        except Exception as e:
            conn.rollback()
            print(f"\n❌ ERROR: Update failed. Rolling back changes.\nDetail: {e}")

if __name__ == "__main__":
    update_schema()