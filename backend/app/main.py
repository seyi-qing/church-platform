from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from sqlalchemy import select

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import AsyncSessionLocal, engine
from app.models.user import User

import app.models  # noqa: F401

settings = get_settings()

# Setup password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 🔒 CHANGE THESE TO YOUR CHOSEN ADMIN CREDENTIALS
ADMIN_EMAIL = "admin@churchplatform.com"
ADMIN_PASSWORD = "Password123!"  # Replace this with a highly secure password
ADMIN_FULL_NAME = "System Administrator"


async def auto_seed_admin():
    """Checks for and seeds the master administrator account automatically on boot."""
    async with AsyncSessionLocal() as session:
        try:
            # Check if the user already exists
            query = select(User).where(User.email == ADMIN_EMAIL)
            result = await session.execute(query)
            existing_admin = result.scalar_one_or_none()

            if not existing_admin:
                print("⏳ Auto-Seeding: Admin account not found. Generating master account...")
                hashed_password = pwd_context.hash(ADMIN_PASSWORD)
                
                admin_user = User(
                    email=ADMIN_EMAIL,
                    hashed_password=hashed_password,
                    full_name=ADMIN_FULL_NAME,
                    role="admin",
                    is_superuser=True,
                    is_active=True,
                )
                session.add(admin_user)
                await session.commit()
                print("🎉 Auto-Seeding: Admin account created successfully!")
            else:
                print("ℹ️ Auto-Seeding: Admin account already exists. Skipping.")
        except Exception as e:
            print(f"❌ Auto-Seeding Error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Create tables locally if in development mode
    if settings.ENVIRONMENT == "development":
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            
    # 2. Run the admin automatic background seeding process
    await auto_seed_admin()
    
    yield
    
    # 3. Clean up engine resources on shutdown
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health")
async def health():
    return {"status": "ok", "service": settings.PROJECT_NAME}
