from fastapi import APIRouter
from ..routes import reports, analyze

router = APIRouter()

router.include_router(reports.router, prefix="/api")
router.include_router(analyze.router, prefix="/api")
