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
        # gets strucutred contrainsts from user input
        constraints = await parse_constraints(request.message, self.llm)

        # tool calls from structured constraints
        raw_results = []
        if constraints.destination:
            search = self.tools.get("search_places")
            if search:
                query_parts = constraints.interests + constraints.dining_preferences
                query = f"{' '.join(query_parts)} in {constraints.destination}" if query_parts else constraints.destination
                results = search.execute(query=query, location=constraints.destination)
                if isinstance(results, list):
                    raw_results.extend(results)

        recommendations = normalize(raw_results)
        ranked = rank(recommendations, constraints)

        return await format_response(ranked, request.message, constraints, self.llm)
