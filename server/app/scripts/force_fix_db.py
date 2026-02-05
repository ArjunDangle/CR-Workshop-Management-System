import sys
import os
from sqlalchemy import text

# Add the server directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from app.core.database import engine

def force_fix():
    print("🚀 Starting Brute Force Database Fix...")
    
    queries = [
        # Fix the Incident table columns
        "ALTER TABLE incident ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT 'GENERAL';",
        "ALTER TABLE incident ADD COLUMN IF NOT EXISTS photos VARCHAR;",
        "ALTER TABLE incident ALTER COLUMN category SET NOT NULL;",
        
        # Fix the CAPA table (ensure it matches the new schema)
        "ALTER TABLE capa ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'PENDING';",
        "ALTER TABLE capa ADD COLUMN IF NOT EXISTS type VARCHAR DEFAULT 'CORRECTIVE';",
    ]
    
    with engine.connect() as conn:
        for query in queries:
            try:
                print(f"   - Executing: {query}")
                conn.execute(text(query))
                conn.commit()
            except Exception as e:
                print(f"   ⚠️  Warning (might already exist): {e}")

    print("✅ Database successfully synchronized with code.")

if __name__ == "__main__":
    force_fix()