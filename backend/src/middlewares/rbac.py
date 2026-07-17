from fastapi import Depends, HTTPException
from starlette import status
from src.services.auth_service import get_current_user
from src.schemas.user_dto import UserOut
from src.models.user import UserRole

def require_role(allowed_roles: list[UserRole]):
    def _require_role(current_user: UserOut = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource"
            )
        return current_user
    return _require_role
