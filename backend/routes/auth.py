from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from auth import create_access_token, get_password_hash, verify_password
from database import get_db
from models import Restaurant, User

router = APIRouter(prefix="/auth", tags=["auth"])


class SignupPayload(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
    restaurant_name: str
    city: str | None = None


class LoginPayload(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)


def _enforce_password_limit(password: str) -> None:
    if len(password.encode("utf-8")) > 72:
        raise HTTPException(status_code=400, detail="Password must be 72 bytes or fewer")


@router.post("/signup")
def signup(payload: SignupPayload, db: Session = Depends(get_db)) -> dict:
    _enforce_password_limit(payload.password)
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    restaurant = Restaurant(name=payload.restaurant_name, city=payload.city)
    db.add(restaurant)
    db.flush()

    user = User(
        restaurant_id=restaurant.id,
        name=payload.name,
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        role="owner",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id, "restaurant_id": user.restaurant_id})
    return {"token": token, "restaurant_id": user.restaurant_id}


@router.post("/login")
def login(payload: LoginPayload, db: Session = Depends(get_db)) -> dict:
    _enforce_password_limit(payload.password)
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user.id, "restaurant_id": user.restaurant_id})
    return {"token": token, "restaurant_id": user.restaurant_id}
