from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.user import User
from app.config import get_jwt_secret

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

SECRET_KEY = get_jwt_secret()
ALGORITHM = "HS256"


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        email = payload.get("sub")

        user = db.query(User).filter(
            User.email == email
        ).first()

        if user is None:

            raise HTTPException(
                status_code=401,
                detail="User not found"
            )

        return user

    except Exception:

        raise HTTPException(
            status_code=401,
            detail="Invalid Token"
        )
def role_required(roles: list):

    def checker(user=Depends(get_current_user)):

        if user.role not in roles:
            raise HTTPException(
                status_code=403,
                detail="Permission Denied"
            )

        return user

    return checker
