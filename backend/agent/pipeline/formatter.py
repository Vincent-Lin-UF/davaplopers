from agent.core.schemas import Recommendation, TripConstraints, ChatResponse
from agent.core.llm import LLMProvider

FORMAT_PROMPT = """You are a travel assistant.

The user asked: {message}

Parsed constraints: {constraints}

Here are the top recommendations:
{recommendations}

Write a concise, friendly response presenting these recommendations.
Mention why each fits their preferences when relevant."""


async def format_response(
    recommendations: list[Recommendation],
    message: str,
    constraints: TripConstraints,
    llm: LLMProvider,
) -> ChatResponse:
    rec_text = "\n".join(
        f"- {r.title} ({r.category}): {r.description or 'No description'}"
        for r in recommendations[:10]
    )

    messages = [
        {
            "role": "system",
            "content": "You are a travel assistant. Be helpful and concise.",
        },
        {
            "role": "user",
            "content": FORMAT_PROMPT.format(
                message=message,
                constraints=constraints.model_dump_json(),
                recommendations=rec_text,
            ),
        },
    ]

    text = await llm.complete(messages)

    return ChatResponse(
        message=text,
        recommendations=recommendations[:10],
        constraints=constraints,
    )
