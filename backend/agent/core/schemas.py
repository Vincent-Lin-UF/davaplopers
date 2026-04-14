from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import date


class TripConstraints(BaseModel):
    destination: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[str] = None  # "low", "moderate", "high"
    interests: list[str] = []
    dining_preferences: list[str] = []
    transportation: Optional[str] = None


class Recommendation(BaseModel):
    title: str
    category: str  # "restaurant", "museum", "park", etc.
    address: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    description: Optional[str] = None
    why_recommended: Optional[str] = None
    estimated_cost: Optional[str] = None
    score: float = 0.0
    tags: list[str] = []
    source: Optional[str] = None


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class SignupResponse(BaseModel):
    user_id: int
    name: str
    email: str


class ChatRequest(BaseModel):
    message: str
    trip_id: Optional[int] = None


class ChatResponse(BaseModel):
    message: str
    recommendations: list[Recommendation] = []
    constraints: Optional[TripConstraints] = None
