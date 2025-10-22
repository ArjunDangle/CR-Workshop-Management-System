# app/main.py
from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from app.modules.auth.auth_router import router as auth_router
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
    # ---
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def read_root():
    return {"message": "Welcome to the Railway Workshop Management System API!"}

app.include_router(auth_router, prefix="/auth", tags=["Authentication"])

@app.get("/health", tags=["Health Check"])
async def health_check():
    return {"status": "ok"}