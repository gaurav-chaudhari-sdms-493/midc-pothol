from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.controllers import auth_controller
from src.schemas import user_dto
from src.services.auth_service import get_current_user, get_token
from src.config.database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/sign-up", response_model=user_dto.UserOut)
def sign_up(user: user_dto.UserCreate, db: Session = Depends(get_db)):
    return auth_controller.sign_up(user, db)

@router.post("/sign-in")
def sign_in(form_data: user_dto.UserLogin, db: Session = Depends(get_db)):
    return auth_controller.sign_in(form_data, db)

@router.post("/sign-out")
def sign_out(token: str = Depends(get_token), db: Session = Depends(get_db)):
    return auth_controller.sign_out(token, db)

@router.get("/me", response_model=user_dto.UserOut)
def get_me(current_user: user_dto.UserOut = Depends(get_current_user)):
    return current_user
