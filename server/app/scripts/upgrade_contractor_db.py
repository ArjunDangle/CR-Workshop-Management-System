# FILE: server/app/scripts/upgrade_contractor_db.py
import sys
import os
from sqlalchemy import text

# Boilerplate to allow importing from 'app'
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from app.core.database import engine

def upgrade_schema():
    print("🛠️  STARTING ENTERPRISE CONTRACTOR DB UPGRADE...")
    print("---------------------------------------")
    
    with engine.connect() as conn:
        conn.begin() 
        try:
            # ==========================================
            # 1. ALTER EXISTING CONTRACTOR & WORKER
            # ==========================================
            print("1️⃣  Extending existing Contractor & Worker tables...")
            
            # Contractor Additions
            conn.execute(text("ALTER TABLE contractor ADD COLUMN IF NOT EXISTS reputation_score FLOAT DEFAULT 100.0;"))
            conn.execute(text("ALTER TABLE contractor ADD COLUMN IF NOT EXISTS empanelment_category VARCHAR DEFAULT 'GENERAL';"))
            conn.execute(text("ALTER TABLE contractor ADD COLUMN IF NOT EXISTS is_watchlist BOOLEAN DEFAULT FALSE;"))
            conn.execute(text("ALTER TABLE contractor ADD COLUMN IF NOT EXISTS parent_contractor_id UUID REFERENCES contractor(id);"))
            
            # Worker Additions
            conn.execute(text("ALTER TABLE worker ADD COLUMN IF NOT EXISTS gate_pass_state VARCHAR DEFAULT 'OUTSIDE';"))
            conn.execute(text("ALTER TABLE worker ADD COLUMN IF NOT EXISTS medical_fitness_category VARCHAR;"))
            conn.execute(text("ALTER TABLE worker ADD COLUMN IF NOT EXISTS safety_induction_date DATE;"))
            conn.execute(text("ALTER TABLE worker ADD COLUMN IF NOT EXISTS safety_induction_score INTEGER;"))

            # ==========================================
            # 2. CREATE NEW DEEP-DIVE TABLES
            # ==========================================
            print("2️⃣  Creating new Enterprise Tables (Contracts, Obligations, GatePass)...")

            # Contract Table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS contract (
                    id UUID PRIMARY KEY,
                    contractor_id UUID NOT NULL REFERENCES contractor(id),
                    tender_number VARCHAR NOT NULL UNIQUE,
                    name VARCHAR NOT NULL,
                    description TEXT,
                    status VARCHAR NOT NULL DEFAULT 'TENDER_ISSUED',
                    start_date DATE,
                    end_date DATE,
                    value FLOAT,
                    mobilization_progress FLOAT DEFAULT 0.0,
                    demobilization_progress FLOAT DEFAULT 0.0
                );
            """))

            # Permit Table modification (Linking Permit directly to Contract)
            conn.execute(text("ALTER TABLE permit ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contract(id);"))

            # Worker Certification Table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS workercertification (
                    id UUID PRIMARY KEY,
                    worker_id UUID NOT NULL REFERENCES worker(id),
                    certification_name VARCHAR NOT NULL,
                    issuing_authority VARCHAR NOT NULL,
                    issue_date DATE NOT NULL,
                    expiry_date DATE
                );
            """))

            # GatePass Table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS gatepass (
                    id UUID PRIMARY KEY,
                    worker_id UUID NOT NULL REFERENCES worker(id),
                    entry_time TIMESTAMP DEFAULT now(),
                    exit_time TIMESTAMP,
                    scanned_by_id UUID,
                    status VARCHAR DEFAULT 'APPROVED',
                    denial_reason VARCHAR
                );
            """))

            # Contract Obligation Table (CLRA Compliance)
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS contractobligation (
                    id UUID PRIMARY KEY,
                    contract_id UUID NOT NULL REFERENCES contract(id),
                    title VARCHAR NOT NULL,
                    description TEXT,
                    type VARCHAR NOT NULL,
                    due_date DATE NOT NULL,
                    status VARCHAR DEFAULT 'PENDING',
                    submitted_at TIMESTAMP,
                    verified_by_id UUID,
                    document_url VARCHAR
                );
            """))

            # Contract Checklist Table (Mob/Demob)
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS contractchecklist (
                    id UUID PRIMARY KEY,
                    contract_id UUID NOT NULL REFERENCES contract(id),
                    phase VARCHAR NOT NULL,
                    task_name VARCHAR NOT NULL,
                    is_completed BOOLEAN DEFAULT FALSE,
                    completed_at TIMESTAMP,
                    completed_by_id UUID
                );
            """))

            conn.commit()
            print("\n✅ SUCCESS: Database Schema Upgraded to Enterprise Contractor Standards.")
        
        except Exception as e:
            conn.rollback()
            print(f"\n❌ ERROR: Update failed. Rolling back changes.\nDetail: {e}")

if __name__ == "__main__":
    upgrade_schema()