from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from starlette import status

from src.config.settings import settings
from src.models import user as user_model, token_blacklist as token_blacklist_model
from src.schemas import user_dto
from src.config.database import get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Define the security scheme
bearer_scheme = HTTPBearer()

def get_token(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> str:
    """Dependency to extract the token string from the 'Authorization: Bearer <token>' header."""
    return credentials.credentials

def get_user_by_email(db: Session, email: str):
    return db.query(user_model.User).filter(user_model.User.email == email).first()

def create_user(db: Session, user: user_dto.UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = user_model.User(email=user.email, hashed_password=hashed_password, name=user.name, role=user.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user or not pwd_context.verify(password, user.hashed_password):
        return None
    return user

def create_token(user: user_model.User):
    to_encode = {
        "sub": user.email,
        "role": user.role.value,
        "jti": str(datetime.utcnow())  # Unique identifier for the token
    }
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return {"access_token": encoded_jwt, "token_type": "bearer", "role": user.role.value, "user": user_dto.UserOut.from_orm(user)}

def get_current_user(token: str = Depends(get_token), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Since tokens don't expire, we don't need to validate the expiration time here.
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm], options={"verify_exp": False})
        email: str = payload.get("sub")
        jti: str = payload.get("jti")
        if email is None or jti is None:
            raise credentials_exception
        
        token_in_blacklist = db.query(token_blacklist_model.TokenBlacklist).filter(token_blacklist_model.TokenBlacklist.jti == jti).first()
        if token_in_blacklist:
            # This token has been signed out.
            raise credentials_exception

    except JWTError:
        raise credentials_exception
    user = get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    return user

def sign_out(token: str, db: Session):
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm], options={"verify_exp": False})
        jti = payload.get("jti")

        if jti:
            # Since the token has no expiry, we can't set an expiry for the blacklist entry.
            # We'll add it without one. A cleanup job would be needed in a real-world scenario
            # to periodically clear out very old blacklisted tokens.
            db_token = token_blacklist_model.TokenBlacklist(jti=jti)
            db.add(db_token)
            db.commit()
            return {"msg": "Successfully logged out"}

    except JWTError:
        # Even if the token is invalid, we can say it's logged out to avoid giving away info.
        raise HTTPException(status_code=400, detail="Invalid token")

    return {"msg": "Successfully logged out"}
