import sys
import os
from sqlalchemy import text

# Path Setup
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import engine

def add_common_tables():
    print("🛠️  Adding Notification & Audit Tables...")
    
    with engine.connect() as conn:
        conn.begin()
        try:
            # 1. Notifications
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS notification (
                    id UUID PRIMARY KEY,
                    user_id UUID NOT NULL,
                    title VARCHAR NOT NULL,
                    message VARCHAR NOT NULL,
                    type VARCHAR NOT NULL,
                    is_read BOOLEAN DEFAULT FALSE,
                    link_url VARCHAR,
                    created_at TIMESTAMP DEFAULT now(),
                    FOREIGN KEY (user_id) REFERENCES "user"(id)
                );
            """))

            # 2. Action Logs
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS actionlog (
                    id UUID PRIMARY KEY,
                    entity_name VARCHAR NOT NULL,
                    entity_id UUID NOT NULL,
                    actor_id UUID,
                    action VARCHAR NOT NULL,
                    details VARCHAR,
                    timestamp TIMESTAMP DEFAULT now()
                );
            """))

            # 3. File Attachments
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS fileattachment (
                    id UUID PRIMARY KEY,
                    entity_name VARCHAR NOT NULL,
                    entity_id UUID NOT NULL,
                    file_name VARCHAR NOT NULL,
                    file_url VARCHAR NOT NULL,
                    uploaded_by_id UUID,
                    uploaded_at TIMESTAMP DEFAULT now(),
                    FOREIGN KEY (uploaded_by_id) REFERENCES "user"(id)
                );
            """))

            conn.commit()
            print("✅ Common Tables Created Successfully.")
        except Exception as e:
            conn.rollback()
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    add_common_tables()