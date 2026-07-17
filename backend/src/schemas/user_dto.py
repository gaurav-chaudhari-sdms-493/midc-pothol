from pydantic import BaseModel, EmailStr
from typing import Optional
from src.models.user import UserRole

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str
    role: UserRole

class UserLogin(BaseModel):
    username: EmailStr
    password: str

class UserOut(UserBase):
    id: int
    role: UserRole

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: UserRole
    user: UserOut
