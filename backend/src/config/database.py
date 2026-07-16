from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .settings import get_settings
from ..schemas.report import Base

settings = get_settings()
DATABASE_URL = settings.database_url

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
