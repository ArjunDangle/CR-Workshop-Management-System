# FILE: server/app/scripts/force_fix_db.py
import sys
import os
from sqlalchemy import text

# Add the server directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from app.core.database import engine

def force_fix():
    print("🚀 Starting Brute Force Database Fix for Incident Phase 1...")
    
    queries =[
        # 1. Incident table updates (SLAs, Reviews, Linkages)
        "ALTER TABLE incident ADD COLUMN IF NOT EXISTS resolution_permit_id UUID REFERENCES permit(id);",
        "ALTER TABLE incident ADD COLUMN IF NOT EXISTS investigation_due_at TIMESTAMP;",
        "ALTER TABLE incident ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;",
        "ALTER TABLE incident ADD COLUMN IF NOT EXISTS reviewed_by_id UUID REFERENCES \"user\"(id);",
        "ALTER TABLE incident ADD COLUMN IF NOT EXISTS review_status VARCHAR DEFAULT 'PENDING_REVIEW';",
        "ALTER TABLE incident ADD COLUMN IF NOT EXISTS review_remarks VARCHAR;",
        
        # 2. Incident Witness Table Creation
        """
        CREATE TABLE IF NOT EXISTS incidentwitness (
            id UUID PRIMARY KEY,
            incident_id UUID NOT NULL REFERENCES incident(id),
            worker_id UUID REFERENCES worker(id),
            user_id UUID REFERENCES "user"(id),
            witness_name VARCHAR NOT NULL,
            statement TEXT NOT NULL,
            recorded_at TIMESTAMP DEFAULT now()
        );
        """
    ]
    
    with engine.connect() as conn:
        for query in queries:
            try:
                print(f"   - Executing: {query.strip()[:60]}...")
                conn.execute(text(query))
                conn.commit()
            except Exception as e:
                print(f"   ⚠️  Warning: {e}")

    print("✅ Database successfully synchronized with Phase 1 Incident Codebase.")

if __name__ == "__main__":
    force_fix()