from typing import Any
from agent.tools.base import Tool

MOCK_DATA = {
    "boston": [
        {
            "name": "Museum of Fine Arts",
            "category": "museum",
            "address": "465 Huntington Ave, Boston, MA",
            "lat": 42.3394,
            "lon": -71.0940,
            "description": "One of the largest art museums in the US with encyclopedic collections",
            "types": ["museum", "art", "culture"],
            "price_level": "moderate",
            "source": "mock",
        },
        {
            "name": "Neptune Oyster",
            "category": "restaurant",
            "address": "63 Salem St, Boston, MA",
            "lat": 42.3637,
            "lon": -71.0546,
            "description": "Popular seafood spot in the North End known for lobster rolls",
            "types": ["restaurant", "seafood", "dining"],
            "price_level": "high",
            "source": "mock",
        },
        {
            "name": "Freedom Trail",
            "category": "attraction",
            "address": "Boston Common, Boston, MA",
            "lat": 42.3554,
            "lon": -71.0655,
            "description": "2.5-mile walking path through 16 historic sites",
            "types": ["attraction", "walking", "history"],
            "price_level": "low",
            "source": "mock",
        },
        {
            "name": "New England Aquarium",
            "category": "attraction",
            "address": "1 Central Wharf, Boston, MA",
            "lat": 42.3591,
            "lon": -71.0490,
            "description": "Waterfront aquarium with marine exhibits and whale watching tours",
            "types": ["attraction", "family", "nature"],
            "price_level": "moderate",
            "source": "mock",
        },
        {
            "name": "Legal Sea Foods",
            "category": "restaurant",
            "address": "255 State St, Boston, MA",
            "lat": 42.3590,
            "lon": -71.0514,
            "description": "Classic Boston seafood chain known for clam chowder",
            "types": ["restaurant", "seafood", "dining"],
            "price_level": "moderate",
            "source": "mock",
        },
    ],
}


class SearchPlacesTool(Tool):
    @property
    def name(self) -> str:
        return "search_places"

    @property
    def description(self) -> str:
        return (
            "Search for places by text query. "
            "Can search by location name or by coordinates."
        )

    @property
    def parameters(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query",
                },
                "location": {
                    "type": "string",
                    "description": "City and/or neighborhood name",
                },
                "lat": {
                    "type": "number",
                    "description": "Latitude for geo-based search",
                },
                "lon": {
                    "type": "number",
                    "description": "Longitude for geo-based search",
                },
                "radius": {
                    "type": "number",
                    "description": "Search radius in meters (default: 5000)",
                },
                "priceLevel": {
                    "type": "array",
                    "items": {"type": "integer"},
                    "description": "Filter by price level(s) [1-4]",
                },
                "openNow": {
                    "type": "boolean",
                    "description": "Filter to only open places",
                },
            },
        }

    def execute(self, **kwargs) -> Any:
        # TODO: Replace with real API call (Google Places, etc.)
        location = (kwargs.get("location") or "").lower()
        for city, results in MOCK_DATA.items():
            if city in location:
                return results
        return []
