from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    
    # Analysis details
    original_image_url = Column(String, nullable=False)
    annotated_image_url = Column(String, nullable=False)
    detection_method = Column(String, nullable=True)
    camera_params = Column(JSON, nullable=True)
    pothole_details = Column(JSON, nullable=True)
    
    # User-reported details
    user_pothole_count = Column(Integer, nullable=True)
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
