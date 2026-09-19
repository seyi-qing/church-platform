"""Create a superuser from the command line.

Usage:
  python -m scripts.create_superuser
"""
import asyncio
import sys

from sqlalchemy import select

from app.core.security import get_password_hash
from app.db.session import AsyncSessionLocal
from app.models.user import User


async def main() -> None:
    email = input("Email: ").strip()
    password = input("Password: ").strip()
    full_name = input("Full name (optional): ").strip() or None
    if not email or not password:
        print("Email and password required")
        sys.exit(1)

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == email))
        if result.scalar_one_or_none():
            print("User already exists")
            sys.exit(1)
        user = User(
            email=email,
            hashed_password=get_password_hash(password),
            full_name=full_name,
            role="pastor",
            is_superuser=True,
            is_active=True,
        )
        db.add(user)
        await db.commit()
        print(f"Superuser created: {email}")


if __name__ == "__main__":
    asyncio.run(main())
