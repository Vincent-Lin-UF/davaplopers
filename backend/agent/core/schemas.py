from typing import Optional
from pydantic import BaseModel

class SearchRequest(BaseModel):
    query: str 
    context: Optional[SearchContext] = None

# Basic search to fine latitude and longitude of places
class SearchContext(BaseModel):
    lat: Optional[float] = None
    lon: Optional[float] = None
