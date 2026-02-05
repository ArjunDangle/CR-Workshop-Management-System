# FILE: server/app/main.py
# app/main.py
from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from app.modules.auth.auth_router import router as auth_router
# --- Import the new permit router ---
from app.modules.permit.permit_router import router as permit_router
from app.modules.machine.machine_router import router as machine_router
# --- MODULE 4 INTEGRATION: Contractor Management ---
from app.modules.contractor.router import router as contractor_router
# --- END MODULE 4 INTEGRATION ---
# --- MODULE 5 INTEGRATION: Incident Management ---
from app.modules.incident.router import router as incident_router
# --- END MODULE 5 INTEGRATION ---

# ---
# --- Import settings ---
from app.core.config import settings
# ---

# Remove the hardcoded origins list
# origins = [ ... ]

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Application startup...")
    yield
    print("Application shutdown...")

app = FastAPI(
    title="Railway Workshop Management System API",
    description="API for managing railway workshop operations.",
    version="0.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    # --- Use setting here ---
    allow_origins=settings.allowed_origins,
 
#    # ---
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def read_root():
    return {"message": "Welcome to the Railway Workshop Management System API!"}

app.include_router(auth_router, prefix="/auth", tags=["Authentication"])

# --- Add the new permit router ---
app.include_router(permit_router, prefix="/permits", tags=["Permit Management"])
# ---
app.include_router(machine_router, prefix="/machines", tags=["Machine Management"])

# --- MODULE 4 INTEGRATION: Contractor Management ---
app.include_router(contractor_router)
# --- END MODULE 4 INTEGRATION ---
# --- MODULE 5 INTEGRATION: Incident Management ---
app.include_router(incident_router)
# --- END MODULE 5 INTEGRATION ---

@app.get("/health", tags=["Health Check"])
async def health_check():
    return {"status": "ok"}
