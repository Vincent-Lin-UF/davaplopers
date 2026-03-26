from agent.core.schemas import ChatRequest, ChatResponse
from agent.core.llm import LLMProvider
from agent.tools.base import Tool
from agent.pipeline.parser import parse_constraints
from agent.pipeline.normalizer import normalize
from agent.pipeline.ranker import rank
from agent.pipeline.formatter import format_response


class Orchestrator:
    def __init__(self, llm: LLMProvider, tools: dict[str, Tool]):
        self.llm = llm
        self.tools = tools

    async def handle(self, request: ChatRequest) -> ChatResponse:
        # gets structured constraints from user input
        constraints = await parse_constraints(request.message, self.llm)

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

        return await format_response(ranked, request.message, constraints, self.llm)
