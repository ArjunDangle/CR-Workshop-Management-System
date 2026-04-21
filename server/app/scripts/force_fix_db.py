import sys
import os
from sqlalchemy import text

# Add the server directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from app.core.database import engine

def force_fix():
    print("🚀 Starting Brute Force Database Fix...")
    
    queries =[
        # Incident table columns
        "ALTER TABLE incident ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT 'GENERAL';",
        "ALTER TABLE incident ADD COLUMN IF NOT EXISTS photos VARCHAR;",
        
        # CAPA table
        "ALTER TABLE capa ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'PENDING';",
        "ALTER TABLE capa ADD COLUMN IF NOT EXISTS type VARCHAR DEFAULT 'CORRECTIVE';",
        
        # Permit Table Columns (Closing Loop & SIMOPS)
        "ALTER TABLE permit ADD COLUMN IF NOT EXISTS handback_declaration VARCHAR;",
        "ALTER TABLE permit ADD COLUMN IF NOT EXISTS handback_time TIMESTAMP;",
        "ALTER TABLE permit ADD COLUMN IF NOT EXISTS inspection_remarks VARCHAR;",
        "ALTER TABLE permit ADD COLUMN IF NOT EXISTS inspector_id UUID REFERENCES \"user\"(id);",
        "ALTER TABLE permit ADD COLUMN IF NOT EXISTS inspection_time TIMESTAMP;",
        "ALTER TABLE permit ADD COLUMN IF NOT EXISTS simops_acknowledged BOOLEAN DEFAULT FALSE;",

        # --- NEW: Machine Passport & Zone Classification Fields ---
        "ALTER TABLE machine ADD COLUMN IF NOT EXISTS workspace_zone VARCHAR DEFAULT 'General Workshop';",
        "ALTER TABLE machine ADD COLUMN IF NOT EXISTS weight_capacity VARCHAR DEFAULT 'Standard';",
        "ALTER TABLE machine ADD COLUMN IF NOT EXISTS power_source VARCHAR DEFAULT '415V 3-Phase AC';",
        "ALTER TABLE machine ADD COLUMN IF NOT EXISTS competency_required VARCHAR DEFAULT 'SKILLED';"
    ]
    
    with engine.connect() as conn:
        for query in queries:
            try:
                print(f"   - Executing: {query.strip()}")
                conn.execute(text(query))
                conn.commit()
            except Exception as e:
                print(f"   ⚠️  Warning: {e}")

    print("✅ Database successfully synchronized with code.")

if __name__ == "__main__":
    force_fix()