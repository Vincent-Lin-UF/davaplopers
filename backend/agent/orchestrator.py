import json
from agent.core.schemas import ChatRequest, ChatResponse
from agent.core.llm import LLMProvider
from agent.tools.base import Tool
from agent.pipeline.parser import parse_constraints
from agent.pipeline.normalizer import normalize
from agent.pipeline.ranker import rank
from agent.pipeline.formatter import format_response


def _attach_images(message_json: str, recommendations) -> str:
    """Post-process plan JSON to add a photo URL to each activity by matching
    its location against the recommendation list."""
    try:
        plan = json.loads(message_json)
    except (json.JSONDecodeError, TypeError):
        return message_json
    if not isinstance(plan, dict) or "days" not in plan:
        return message_json

    recs = [(r.title.lower(), r.image) for r in recommendations if r.image and r.title]
    if not recs:
        return message_json

    for day in plan.get("days", []):
        for activity in day.get("activities", []):
            loc = (activity.get("location") or "").lower()
            if not loc:
                continue
            for title, image in recs:
                if title in loc or loc in title:
                    activity["image"] = image
                    break

    return json.dumps(plan)


class Orchestrator:
    def __init__(self, llm: LLMProvider, tools: dict[str, Tool]):
        self.llm = llm
        self.tools = tools

    async def handle(self, request: ChatRequest) -> ChatResponse:
        history = [{"role": t.role, "content": t.content} for t in request.history]

        # gets structured constraints from user input
        constraints = await parse_constraints(request.message, self.llm, history)

        # tool calls from structured constraints
        raw_results = []
        if constraints.destination:
            search = self.tools.get("search_places")
            if search:
                # separate search per category for diverse results
                queries = constraints.interests + constraints.dining_preferences
                if not queries:
                    queries = [constraints.destination]

                seen_ids = set()
                for query in queries:

                    results = search.execute(
                        query=query, location=constraints.destination
                    )

                    if isinstance(results, list):
                        for r in results:
                            # deduplicate by place_id or name
                            key = r.get("place_id") or r.get("name")
                            if key not in seen_ids:
                                seen_ids.add(key)
                                raw_results.append(r)

        recommendations = normalize(raw_results)
        ranked = rank(recommendations, constraints)

        response = await format_response(ranked, request.message, constraints, self.llm, history)
        response.message = _attach_images(response.message, ranked)
        return response
