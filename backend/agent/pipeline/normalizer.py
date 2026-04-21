from agent.core.schemas import Recommendation

# converting raw output into Reccomendation Objects
def normalize(raw_results: list[dict]) -> list[Recommendation]:
    recommendations = []
    for item in raw_results:
        rec = Recommendation(
            title=item.get("name", item.get("title", "Unknown")),
            category=item.get("category", item.get("type", "place")),
            address=item.get("address", item.get("formatted_address")),
            lat=item.get("lat", item.get("latitude")),
            lon=item.get("lon", item.get("longitude")),
            description=item.get("description", item.get("summary")),
            estimated_cost=item.get("price_level", item.get("estimated_cost")),
            tags=item.get("tags", item.get("types", [])),
            source=item.get("source", "tool"),
            image=item.get("image"),
        )
        recommendations.append(rec)
    return recommendations
