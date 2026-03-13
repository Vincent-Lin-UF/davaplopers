from agent.core.schemas import TripConstraints
from agent.core.llm import LLMProvider

PARSE_PROMPT = """Extract trip constraints from the user message below.
Return ONLY valid JSON with these fields (omit any not mentioned):
- destination (string)
- start_date (YYYY-MM-DD)
- end_date (YYYY-MM-DD)
- budget ("low", "moderate", "high")
- interests (list of strings)
- dining_preferences (list of strings)
- transportation (string)

User message: {message}"""


async def parse_constraints(message: str, llm: LLMProvider) -> TripConstraints:
    messages = [
        {
            "role": "system",
            "content": "You extract structured travel constraints from user messages. Respond with only valid JSON.",
        },
        {"role": "user", "content": PARSE_PROMPT.format(message=message)},
    ]
    data = await llm.extract_json(messages)
    return TripConstraints(**data)
