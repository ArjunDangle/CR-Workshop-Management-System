# scripts/seed.py
import uuid
from sqlmodel import Session, select
from app.core.database import get_db_session
from app.models import Role, User

# --- Placeholder for password hashing ---
try:
    from app.modules.auth.auth_service import get_password_hash
except ImportError:
    print("WARNING: 'get_password_hash' not found. Using dummy hash. Run seed again after creating auth_service.py.")
    def get_password_hash(password: str) -> str:
        print(f"Warning: Using dummy hash for password '{password}'")
        return f"dummy_hash_for_{password}"

# --- Define Seed Data ---
BASE_ROLES_DATA = [
    {"name": "SSE-Maintenance", "description": "Parent role for maintenance staff"},
    {"name": "SSE-Office", "description": "Office staff"},
    {"name": "Safety Officer", "description": "Safety department staff"},
]

SUBCLASS_DATA = [
     {"name": "SSE-Maintenance - MW", "parent_name": "SSE-Maintenance", "description": "Machine & Works"},
     {"name": "SSE-Maintenance - Substation", "parent_name": "SSE-Maintenance", "description": "Electrical Substation"},
]

USERS_DATA = [
    {
        "email": "test_mw@example.com",
        "password": "testpassword123",
        "role_name": "SSE-Maintenance - MW",
        "full_name": "Test MW User",
    },
     {
        "email": "safety_officer@example.com",
        "password": "safetypassword123",
        "role_name": "Safety Officer",
        "full_name": "Safety Test User",
    },
]


def seed_database():
    """
    Populates the database with initial roles and users.
    Checks for existing entries before adding.
    """
    print("🌱 Starting database seeding...")
    created_parent_roles_map = {}

    with get_db_session() as db:
        try:
            # 1. Create Parent Roles
            print("\n--- Processing Parent Roles ---")
            for role_data in BASE_ROLES_DATA:
                statement = select(Role).where(Role.name == role_data["name"])
                # Use execute() instead of exec()
                existing_role = db.execute(statement).scalar_one_or_none()
                if not existing_role:
                    role = Role(**role_data)
                    db.add(role)
                    print(f"➕ Adding role: '{role.name}'")
                    db.flush()
                    if role.id: # Check if ID is assigned after flush
                       created_parent_roles_map[role.name] = role.id
                    else:
                       # Re-fetch if flush didn't populate ID (less common but possible)
                       db.commit()
                       db.refresh(role)
                       created_parent_roles_map[role.name] = role.id
                       print(f"   (ID assigned: {role.id})")
                else:
                    print(f"☑️ Role '{role_data['name']}' already exists, skipping.")
                    created_parent_roles_map[role_data['name']] = existing_role.id

            # Commit might not be needed here if flush worked, but safe to keep
            db.commit()
            print("Parent roles committed.")

            # 2. Create Child Roles
            print("\n--- Processing Child Roles ---")
            roles_to_refresh = []
            for sub_data in SUBCLASS_DATA:
                statement = select(Role).where(Role.name == sub_data["name"])
                # Use execute() instead of exec()
                existing_subclass = db.execute(statement).scalar_one_or_none()
                if not existing_subclass:
                    parent_id = created_parent_roles_map.get(sub_data["parent_name"])
                    if parent_id:
                        subclass = Role(
                            name=sub_data["name"],
                            description=sub_data.get("description"),
                            parent_id=parent_id
                        )
                        db.add(subclass)
                        roles_to_refresh.append(subclass)
                        print(f"➕ Adding subclass: '{subclass.name}' under '{sub_data['parent_name']}'")
                    else:
                         print(f"⚠️ Warning: Parent role '{sub_data['parent_name']}' not found for subclass '{sub_data['name']}'. Skipping.")
                else:
                    print(f"☑️ Subclass '{sub_data['name']}' already exists, skipping.")

            db.commit()
            print("Child roles committed.")

            # 3. Create Users
            print("\n--- Processing Users ---")
            users_to_refresh = []
            for user_data in USERS_DATA:
                statement = select(User).where(User.email == user_data["email"])
                # Use execute() instead of exec()
                existing_user = db.execute(statement).scalar_one_or_none()

                if not existing_user:
                    statement = select(Role).where(Role.name == user_data["role_name"])
                    # Use execute() instead of exec()
                    user_role = db.execute(statement).scalar_one_or_none()

                    if user_role and user_role.id:
                        hashed_password = get_password_hash(user_data["password"])
                        user = User(
                            email=user_data["email"],
                            hashed_password=hashed_password,
                            role_id=user_role.id,
                            full_name=user_data.get("full_name"),
                            is_active=user_data.get("is_active", True)
                        )
                        db.add(user)
                        users_to_refresh.append(user)
                        print(f"➕ Adding user: '{user.email}' with role '{user_role.name}'")
                    else:
                        print(f"⚠️ Error: Role '{user_data['role_name']}' not found for user '{user_data['email']}'. User not created.")
                else:
                    print(f"☑️ User '{user_data['email']}' already exists, skipping.")

            db.commit()
            print("Users committed.")

            print("\n✅ Database seeding completed successfully.")

        except Exception as e:
            print(f"❌ An error occurred during seeding: {e}")
            db.rollback()

if __name__ == "__main__":
    seed_database()