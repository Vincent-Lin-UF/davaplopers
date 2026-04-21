import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")

# MySQL (UF hosting) — fill in values from your mysql_credentials file
DB_HOST = os.getenv("DB_HOST")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

JWT_SECRET = os.getenv("JWT_SECRET", "change_this_to_a_long_random_secret")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Google Sign-In — must match the Client ID wired into the frontend's login button
GOOGLE_CLIENT_ID = os.getenv(
    "GOOGLE_CLIENT_ID",
    "143526963027-1vb8npsrdgjdhg92goh91nekbs79dvib.apps.googleusercontent.com",
)

# Email — two paths. If RESEND_API_KEY is set we use the HTTP API (works on DO droplets,
# which block outbound SMTP). Otherwise we fall back to direct SMTP for local dev.
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "")  # e.g. "onboarding@resend.dev" for testing

# SMTP (fallback — works locally, blocked on DigitalOcean droplets)
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
APP_URL = os.getenv("APP_URL", "http://localhost:4200")

# CORS — comma-separated list of allowed origins. Default to local dev.
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:4200").split(",") if o.strip()]
