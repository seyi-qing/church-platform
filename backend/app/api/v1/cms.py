from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import AdminUser, DbSession
from app.models.cms import Page
from app.schemas.cms import PageCreate, PageOut, PageUpdate

router = APIRouter(prefix="/cms", tags=["cms / website"])


@router.post("/pages", response_model=PageOut, status_code=status.HTTP_201_CREATED)
async def create_page(payload: PageCreate, db: DbSession, _: AdminUser):
    existing = await db.execute(select(Page).where(Page.slug == payload.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Slug already exists")
    page = Page(**payload.model_dump())
    db.add(page)
    await db.flush()
    await db.refresh(page)
    return page


@router.get("/pages", response_model=list[PageOut])
async def list_pages(db: DbSession, published_only: bool = True):
    query = select(Page)
    if published_only:
        query = query.where(Page.is_published == True)  # noqa: E712
    result = await db.execute(query.order_by(Page.nav_order, Page.title))
    return result.scalars().all()


@router.get("/pages/id/{page_id}", response_model=PageOut)
async def get_page_by_id(page_id: int, db: DbSession, _: AdminUser):
    result = await db.execute(select(Page).where(Page.id == page_id))
    page = result.scalar_one_or_none()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page


@router.get("/pages/{slug}", response_model=PageOut)
async def get_page_by_slug(slug: str, db: DbSession):
    result = await db.execute(select(Page).where(Page.slug == slug))
    page = result.scalar_one_or_none()
    if not page or not page.is_published:
        raise HTTPException(status_code=404, detail="Page not found")
    return page


@router.patch("/pages/{page_id}", response_model=PageOut)
async def update_page(page_id: int, payload: PageUpdate, db: DbSession, _: AdminUser):
    result = await db.execute(select(Page).where(Page.id == page_id))
    page = result.scalar_one_or_none()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(page, k, v)
    await db.flush()
    await db.refresh(page)
    return page
