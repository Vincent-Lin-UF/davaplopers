from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Change later -> right now it is allowing everything
app.add_middleware(
    CORSMiddleware,
    allow_origins=[*],
    allow_credentials=True,
    allow_methods=[*],
    allow_headers=[""],
)

@app.get("/health")
async def get_health():
    return {"status" : "healthy"}


