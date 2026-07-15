import os
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import datetime

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    
    # Analysis details
    original_image_url = Column(String, nullable=False)
    annotated_image_url = Column(String, nullable=False)
    detection_method = Column(String, nullable=True) # To store which model was used
    camera_params = Column(JSON, nullable=True)
    pothole_details = Column(JSON, nullable=True)
    
    # User-reported details
    lat = Column(Float, index=True, nullable=True)
    lng = Column(Float, index=True, nullable=True)
    address = Column(String, nullable=True)
    status = Column(String, default="Pending Analysis")
    reportedBy = Column(String, nullable=True)
    reportedDate = Column(DateTime, default=datetime.datetime.utcnow)
    severity = Column(String, nullable=True)
    message = Column(String, nullable=True)
    
    # Consolidated fields
    estSize = Column(String, nullable=True)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()