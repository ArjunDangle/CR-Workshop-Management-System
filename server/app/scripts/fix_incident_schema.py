import sys
import os
from sqlalchemy import text

# Add the server directory to path so we can import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from app.core.database import engine

def fix_schema():
    print("🛠️  Fixing Incident Table Schema...")
    
    with engine.connect() as conn:
        try:
            # 1. Add 'category' column to 'incident' table
            # We add it as nullable first, then we can set a default
            print("   - Adding 'category' column...")
            conn.execute(text("ALTER TABLE incident ADD COLUMN IF NOT EXISTS category VARCHAR;"))
            
            # 2. Set a default value for existing rows
            print("   - Updating existing rows with default category...")
            conn.execute(text("UPDATE incident SET category = 'GENERAL' WHERE category IS NULL;"))
            
            # 3. Make it NOT NULL
            conn.execute(text("ALTER TABLE incident ALTER COLUMN category SET NOT NULL;"))

            # 4. Add missing 'photos' column if it's referenced in code but missing in DB
            print("   - Checking for 'photos' column...")
            conn.execute(text("ALTER TABLE incident ADD COLUMN IF NOT EXISTS photos VARCHAR;"))

            conn.commit()
            print("✅ SUCCESS: Database schema fixed.")
        except Exception as e:
            conn.rollback()
            print(f"❌ ERROR: Failed to fix schema: {e}")

if __name__ == "__main__":
    fix_schema()