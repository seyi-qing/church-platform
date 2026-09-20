# seed_admin.py
import asyncio
from passlib.context import CryptContext
from sqlalchemy import select

# Adjust these import paths to match your project structure!
from app.db.session import AsyncSessionLocal, engine
from app.models.user import User

# Configuration context for hashing passwords (matching your auth system)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 🔒 CHANGE THESE TO YOUR CHOSEN ADMIN CREDENTIALS
ADMIN_EMAIL = "admin@churchplatform.com"
ADMIN_PASSWORD = "Password123!"  # Make sure this is a strong password!
ADMIN_FULL_NAME = "System Administrator"


async def seed_admin():
    print("⏳ Connecting to Neon database and initializing script...")
    
    async with AsyncSessionLocal() as session:
        try:
            # 1. Check if the admin account already exists
            query = select(User).where(User.email == ADMIN_EMAIL)
            result = await session.execute(query)
            existing_admin = result.scalar_one_or_none()

            if existing_admin:
                print(f"ℹ️ Admin user with email '{ADMIN_EMAIL}' already exists. Skipping.")
                return

            print("➕ Admin account not found. Generating master credentials...")

            # 2. Hash the password securely using bcrypt
            hashed_password = pwd_context.hash(ADMIN_PASSWORD)

            # 3. Instantiate your User object with full operational privileges
            admin_user = User(
                email=ADMIN_EMAIL,
                hashed_password=hashed_password,
                full_name=ADMIN_FULL_NAME,
                role="admin",         # Grants application roles
                is_superuser=True,    # Grants maximum security clearance
                is_active=True,
            )

            # 4. Save directly into your production tables
            session.add(admin_user)
            await session.commit()
            print(f"🎉 Success! Admin account '{ADMIN_EMAIL}' has been successfully seeded.")

        except Exception as e:
            await session.rollback()
            print(f"❌ Critical error during database seeding: {e}")
        finally:
            await session.close()

    # Clean up background connection engine resources
    await engine.dispose()


if __name__ == "__main__":
    # Execute the asynchronous routine loop
    asyncio.run(seed_admin())
