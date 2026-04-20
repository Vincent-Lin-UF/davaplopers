from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException
import bcrypt
from jose import jwt
from agent.core.schemas import SignupRequest, SignupResponse, LoginRequest, LoginResponse
from agent.core.config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRE_MINUTES
from db.connection import execute_one, execute_write

router = APIRouter()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(user_id: int, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "email": email, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


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

    token = create_access_token(user_id, request.email)
    return SignupResponse(
        access_token=token,
        user_id=user_id,
        name=request.name,
        email=request.email,
    )


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    user = await execute_one(
        "SELECT user_id, name, email, password_hashed FROM users WHERE email = %s",
        (request.email,)
    )
    if not user or not verify_password(request.password, user["password_hashed"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user["user_id"], user["email"])
    return LoginResponse(
        access_token=token,
        user_id=user["user_id"],
        name=user["name"],
        email=user["email"],
    )
