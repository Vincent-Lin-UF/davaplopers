from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel, EmailStr

class TripConstraints(BaseModel):
    destination: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[str] = None
    interests: list[str] = []
    dining_preferences: list[str] = []
    transportation: Optional[str] = None


class Recommendation(BaseModel):
    title: str
    category: str
    address: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    description: Optional[str] = None
    why_recommended: Optional[str] = None
    estimated_cost: Optional[str] = None
    score: float = 0.0
    tags: list[str] = []
    source: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    trip_id: Optional[int] = None


class ChatResponse(BaseModel):
    message: str
    recommendations: list[Recommendation] = []
    constraints: Optional[TripConstraints] = None


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class SignupResponse(BaseModel):
    user_id: int
    name: str
    email: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: Optional[str]
    email: str


class TripCreate(BaseModel):
    trip_name: Optional[str] = None
    destination: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class TripUpdate(BaseModel):
    trip_name: Optional[str] = None
    destination: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class TripOut(BaseModel):
    trip_id: int
    user_id: int
    trip_name: Optional[str]
    destination: Optional[str]
    start_date: Optional[date]
    end_date: Optional[date]



class BucketItemCreate(BaseModel):
    title: str
    category: Optional[str] = None
    priority: str = "medium"
    location_name: Optional[str] = None
    notes: Optional[str] = None


class BucketItemUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    location_name: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class BucketItemOut(BaseModel):
    item_id: int
    trip_id: int
    title: str
    category: Optional[str]
    priority: str
    location_name: Optional[str]
    notes: Optional[str]
    status: str


class CalendarEventCreate(BaseModel):
    title: str
    event_date: date
    bucket_item_id: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    location_name: Optional[str] = None


class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    event_date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    location_name: Optional[str] = None


class CalendarEventOut(BaseModel):
    event_id: int
    trip_id: int
    bucket_item_id: Optional[int]
    title: str
    event_date: date
    start_time: Optional[str]
    end_time: Optional[str]
    location_name: Optional[str]




class InviteCreate(BaseModel):
    invite_email: EmailStr
    permission_level: str = "viewer"


class InviteOut(BaseModel):
    invite_id: int
    trip_id: int
    invite_email: str
    permission_level: str
    invite_status: str
    created_at: Optional[datetime] = None