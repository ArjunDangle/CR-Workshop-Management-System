# create_tables.py
from app.core.database import create_db_and_tables, engine # Import necessary items
# Make sure models are imported BEFORE create_db_and_tables uses create_all
from app import models # This ensures SQLModel knows about your tables

def main():
    print("Attempting to create database tables...")
    try:
        # Note: create_db_and_tables now needs modification to not print skipped message
        # OR we call create_all directly here. Let's call directly for clarity.
        SQLModel.metadata.create_all(engine)
        print("Database tables created successfully (if they didn't exist).")
    except Exception as e:
        print(f"Error creating tables: {e}")

if __name__ == "__main__":
    main()