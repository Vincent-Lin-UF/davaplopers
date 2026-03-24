import requests
from typing import Any
from agent.tools.base import Tool
from agent.core.config import GOOGLE_PLACES_API_KEY

DETAILS_URL = "https://places.googleapis.com/v1/places/"

FIELD_MASK = ",".join([
    "id",
    "displayName",
    "formattedAddress",
    "location",
    "types",
    "priceLevel",
    "regularOpeningHours",
    "nationalPhoneNumber",
    "websiteUri",
    "editorialSummary",
    "rating",
    "userRatingCount",
])


class GetPlaceDetailsTool(Tool):
    @property
    def name(self) -> str:
        return "get_place_details"

    @property
    def description(self) -> str:
        return "Gets detailed information on a specific location including hours, contact info, and ratings"

    @property
    def parameters(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "placeId": {
                    "type": "string",
                    "description": "Unique Google place ID",
                }
            },
            "required": ["placeId"],
        }

    def execute(self, **kwargs) -> Any:
        place_id = kwargs.get("placeId", "")

        if not GOOGLE_PLACES_API_KEY or not place_id:
            return None

        headers = {
            "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
            "X-Goog-FieldMask": FIELD_MASK,
        }

        resp = requests.get(f"{DETAILS_URL}{place_id}", headers=headers)
        if resp.status_code != 200:
            return None

        place = resp.json()
        hours = place.get("regularOpeningHours", {})
        types = place.get("types", [])

        return {
            "place_id": place.get("id"),
            "name": place.get("displayName", {}).get("text"),
            "category": types[0] if types else "place",
            "address": place.get("formattedAddress"),
            "lat": place.get("location", {}).get("latitude"),
            "lon": place.get("location", {}).get("longitude"),
            "types": types,
            "price_level": place.get("priceLevel"),
            "description": (place.get("editorialSummary") or {}).get("text"),
            "phone": place.get("nationalPhoneNumber"),
            "website": place.get("websiteUri"),
            "hours": hours.get("weekdayDescriptions", []),
            "rating": place.get("rating"),
            "review_count": place.get("userRatingCount"),
            "source": "google_places",
        }
