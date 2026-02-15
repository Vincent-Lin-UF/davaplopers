from typing import Any, Optional
from agent.tools.base import Tool 

# TODO: Add Mocks and execute and potential helper functions

class SearchPlacesTool(Tool):
    @property 
    def name(self) -> str:
        return "search_places"

    @property 
    def description(self) -> str:
        return (
            "Search for places by text query"
            "Could serach by location name or by coordinates"
        )

    @property 
    def parameters(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query ",
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
                    "description": "Search radius in meteres (default: 5000)",
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
