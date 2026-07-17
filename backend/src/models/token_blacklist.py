from sqlalchemy import Column, Integer, String, DateTime
from src.config.database import Base

class TokenBlacklist(Base):
    __tablename__ = "token_blacklist"

    id = Column(Integer, primary_key=True, index=True)
    jti = Column(String, unique=True, index=True)
    expires_at = Column(DateTime, nullable=True) # Make expires_at optional
