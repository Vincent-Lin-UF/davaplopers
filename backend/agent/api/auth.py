import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException
import bcrypt
from jose import jwt
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from agent.core.schemas import (
    SignupRequest, SignupResponse, LoginRequest, LoginResponse, GoogleAuthRequest,
)
from agent.core.config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRE_MINUTES, GOOGLE_CLIENT_ID
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


@router.post("/google", response_model=LoginResponse)
async def google_auth(request: GoogleAuthRequest):
    """Verify a Google ID token and log the user in (creating an account if new)."""
    try:
        info = google_id_token.verify_oauth2_token(
            request.id_token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google ID token")

    email = info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Google token missing email")
    name = info.get("name") or email.split("@")[0]

    user = await execute_one(
        "SELECT user_id, name, email FROM users WHERE email = %s",
        (email,),
    )
    if user:
        user_id = user["user_id"]
        display_name = user["name"] or name
    else:
        # New user — create with a random password they'll never use
        hashed = hash_password(secrets.token_urlsafe(32))
        user_id = await execute_write(
            "INSERT INTO users (name, email, password_hashed) VALUES (%s, %s, %s)",
            (name, email, hashed),
        )
        display_name = name

    token = create_access_token(user_id, email)
    return LoginResponse(
        access_token=token,
        user_id=user_id,
        name=display_name,
        email=email,
    )
