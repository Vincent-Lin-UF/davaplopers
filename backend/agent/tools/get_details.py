from typing import Any
from agent.tools.base import Tool

# TODO: Need to add Mock Details for testing

class GetPlaceDetailsTool(Tool):
    @property 
    def name(self) -> str:
        return "get_place_details"

    @property
    def description(self) -> str:
        return "Tool to gets detailed information on a specific location including hours, contact info, and photos"

    @property
    def parameters(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "placeId": {
                    "type": "string",
                    "description": "Unique place ID",
                }
            },
            "required": ["placeId"],
        }

    def execute(self, placeId: str) -> Any:
        details = None
        return {"placeId": placeId, **details}

get_place_details_tool = GetPlaceDetailsTool()
