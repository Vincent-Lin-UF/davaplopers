from fastapi import APIRouter
from agent.core.schemas import ChatRequest, ChatResponse
from agent.core.llm import OpenAIProvider
from agent.core.config import OPENAI_API_KEY, OPENAI_MODEL
from agent.orchestrator import Orchestrator
from agent.tools.search_places import SearchPlacesTool

router = APIRouter()


def get_orchestrator() -> Orchestrator:
    llm = OpenAIProvider(api_key=OPENAI_API_KEY, model=OPENAI_MODEL)
    tools = {"search_places": SearchPlacesTool()}
    return Orchestrator(llm=llm, tools=tools)


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    orchestrator = get_orchestrator()
    return await orchestrator.handle(request)
