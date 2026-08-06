from fastapi import HTTPException, status, Depends, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.utils.security import verify_token

async def get_current_user_with_role(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Get current user and verify they have a role"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError()
        
    except (ValueError, IndexError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format"
        )
    
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.user_id == int(user_id)).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


# Role-specific dependency functions
async def require_user_role(
    current_user: User = Depends(get_current_user_with_role)
):
    """Require user role (role_id = 1)"""
    if current_user.role_id != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. User role required."
        )
    return current_user


async def require_dermatologist_role(
    current_user: User = Depends(get_current_user_with_role)
):
    """Require dermatologist role (role_id = 2)"""
    if current_user.role_id != 2:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Dermatologist role required."
        )
    return current_user


async def require_consultant_role(
    current_user: User = Depends(get_current_user_with_role)
):
    """Require consultant role (role_id = 3)"""
    if current_user.role_id != 3:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Consultant role required."
        )
    return current_user


async def require_admin_role(
    current_user: User = Depends(get_current_user_with_role)
):
    """Require admin role (role_id = 4)"""
    if current_user.role_id != 4:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin role required."
        )
    return current_user