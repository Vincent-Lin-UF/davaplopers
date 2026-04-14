from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from agent.api.routes import router
from agent.api.auth import router as auth_router
from db.connection import get_pool, close_pool


@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_pool()   # open connection pool on startup
    yield
    await close_pool() # close on shutdown


app = FastAPI(lifespan=lifespan)

# Change later -> right now it is allowing everything
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")
app.include_router(auth_router, prefix="/api/auth")


@app.get("/health")
async def get_health():
    return {"status": "healthy"}
