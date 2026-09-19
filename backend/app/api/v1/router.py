from fastapi import APIRouter

from app.api.v1 import auth, members, giving, media, events, livestream, cms, ai, analytics, notifications, campuses, care

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(members.router)
api_router.include_router(giving.router)
api_router.include_router(media.router)
api_router.include_router(events.router)
api_router.include_router(livestream.router)
api_router.include_router(cms.router)
api_router.include_router(ai.router)
api_router.include_router(analytics.router)
api_router.include_router(notifications.router)
api_router.include_router(campuses.router)
api_router.include_router(care.router)
