import os
import re

# Config: Where is your 'app' folder?
BASE_DIR = os.path.join(os.path.dirname(__file__), "..") # server/app
SERVER_DIR = os.path.join(BASE_DIR, "..")

def find_sqlmodels():
    print("--- Scanning for SQLModel Tables ---")
    
    imports = []
    
    for root, dirs, files in os.walk(BASE_DIR):
        for file in files:
            if file.endswith(".py"):
                path = os.path.join(root, file)
                
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                    
                # Look for 'table=True' or 'table = True'
                if "table=True" in content or "table = True" in content:
                    # Calculate python import path
                    rel_path = os.path.relpath(path, SERVER_DIR)
                    # Convert 'app/modules/auth/models.py' -> 'app.modules.auth.models'
                    import_path = rel_path.replace(os.sep, ".").replace(".py", "")
                    
                    print(f"  [+] Found table in: {rel_path}")
                    imports.append(f"import {import_path}")

    print("\n--- COPY THESE LINES INTO server/alembic/env.py ---")
    print("# Auto-generated imports for Alembic")
    for line in imports:
        print(line)
    print("---------------------------------------------------")

if __name__ == "__main__":
    find_sqlmodels()