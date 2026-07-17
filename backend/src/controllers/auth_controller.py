from fastapi import HTTPException
from sqlalchemy.orm import Session
from starlette import status

from src.services import auth_service
from src.schemas import user_dto

def sign_up(user: user_dto.UserCreate, db: Session):
    db_user = auth_service.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return auth_service.create_user(db=db, user=user)

def sign_in(form_data: user_dto.UserLogin, db: Session):
    user = auth_service.authenticate_user(db, email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return auth_service.create_token(user=user)

def sign_out(token: str, db: Session):
    return auth_service.sign_out(token, db)

def get_current_user_info(current_user: user_dto.UserOut):
    return current_user
