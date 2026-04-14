from fastapi import APIRouter, HTTPException
import bcrypt
from agent.core.schemas import SignupRequest, SignupResponse
from db.connection import execute_one, execute_write

router = APIRouter()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


@router.post("/signup", response_model=SignupResponse)
async def signup(request: SignupRequest):
    existing = await execute_one(
        "SELECT user_id FROM users WHERE email = %s",
        (request.email,)
    )
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    hashed = hash_password(request.password)
    user_id = await execute_write(
        "INSERT INTO users (name, email, password_hashed) VALUES (%s, %s, %s)",
        (request.name, request.email, hashed)
    )

    return SignupResponse(user_id=user_id, name=request.name, email=request.email)
