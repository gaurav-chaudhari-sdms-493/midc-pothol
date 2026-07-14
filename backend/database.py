import os
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from dotenv import load_dotenv
import datetime

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Pothole(Base):
    __tablename__ = "potholes"

    id = Column(String, primary_key=True, index=True)
    lat = Column(Float, index=True)
    lng = Column(Float, index=True)
    address = Column(String)
    status = Column(String, default="Pending")
    reportedBy = Column(String)
    reportedDate = Column(String)
    severity = Column(String)
    imageUrl = Column(String)
    estSize = Column(String, nullable=True)
    estDepth = Column(String, nullable=True)
    fixType = Column(String, nullable=True)
    estCost = Column(String, nullable=True)

class AnalysisSession(Base):
    __tablename__ = "analysis_sessions"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    original_image_url = Column(String)
    annotated_image_url = Column(String)
    camera_params = Column(JSON)
    detected_potholes = relationship("DetectedPothole", back_populates="session")

class DetectedPothole(Base):
    __tablename__ = "detected_potholes"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("analysis_sessions.id"))
    pothole_id_in_image = Column(Integer)
    confidence = Column(Float)
    box_pixels = Column(JSON)
    estimated_distance_m = Column(Float, nullable=True)
    estimated_width_cm = Column(Float, nullable=True)
    
    session = relationship("AnalysisSession", back_populates="detected_potholes")


def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
