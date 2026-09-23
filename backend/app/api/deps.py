from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_token
from app.db.session import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False,
)

DbSession = Annotated[AsyncSession, Depends(get_db)]
TokenDep = Annotated[str, Depends(oauth2_scheme)]

# Role hierarchy notes (frontend mirrors these lists):
# admin, pastor  → full staff + finance + AI
# treasurer      → giving + expenses (finance)
# leader         → people, ministry content, attendance
# secretary      → people, events, announcements, attendance
# member         → public + own profile/giving

STAFF_ROLES = ("admin", "pastor", "leader", "secretary", "treasurer")
LEADER_ROLES = ("admin", "pastor", "leader", "secretary")  # pastoral/ops, not only finance
ADMIN_ROLES = ("admin", "pastor")
FINANCE_ROLES = ("admin", "pastor", "treasurer")


async def get_current_user(db: DbSession, token: TokenDep) -> User:
    user_id = verify_token(token, expected_type="access")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def get_current_user_optional(
    db: DbSession,
    token: Annotated[str | None, Depends(oauth2_scheme_optional)] = None,
) -> User | None:
    if not token:
        return None
    user_id = verify_token(token, expected_type="access")
    if not user_id:
        return None
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        return None
    return user


OptionalUser = Annotated[User | None, Depends(get_current_user_optional)]


def require_roles(*roles: str) -> Callable:
    async def role_checker(current_user: CurrentUser) -> User:
        if current_user.is_superuser:
            return current_user
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return role_checker


AdminUser = Annotated[User, Depends(require_roles(*ADMIN_ROLES))]
LeaderUser = Annotated[User, Depends(require_roles(*LEADER_ROLES))]
StaffUser = Annotated[User, Depends(require_roles(*STAFF_ROLES))]
FinanceUser = Annotated[User, Depends(require_roles(*FINANCE_ROLES))]
