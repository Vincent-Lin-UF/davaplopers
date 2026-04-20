from agent.core.schemas import Recommendation, TripConstraints, ChatResponse
from agent.core.llm import LLMProvider
import json, re

def _extract_day_count(message: str) -> int:
    """Extract number of days from user message."""
    msg = message.lower()
    # weeks
    m = re.search(r'(\d+)\s*week', msg)
    if m: return int(m.group(1)) * 7
    # days
    m = re.search(r'(\d+)\s*day', msg)
    if m: return int(m.group(1))
    # night
    m = re.search(r'(\d+)\s*night', msg)
    if m: return int(m.group(1))
    return 5  # default


FORMAT_PROMPT = """You are PlanCation, an expert AI travel planner.

The user asked: {message}
Number of days requested: {num_days}
Parsed constraints: {constraints}
Available places from search: {recommendations}

Return ONLY a valid JSON object (no markdown, no code blocks) with EXACTLY this structure.
You MUST generate EXACTLY {num_days} days in the "days" array — no more, no less.

{{
  "destination": "City, Country",
  "duration": "{num_days} days",
  "overview": "2-3 sentence engaging summary",
  "hotel": {{
    "name": "Recommended hotel name",
    "address": "Full hotel address",
    "description": "Why this hotel is great",
    "price_range": "$$ (moderate)"
  }},
  "days": [
    {{
      "day": 1,
      "title": "Day theme title",
      "activities": [
        {{
          "time": "09:00",
          "end_time": "11:00",
          "activity": "Activity name",
          "location": "Specific location name, City",
          "description": "2-3 sentence description",
          "duration": "2 hours"
        }},
        {{
          "time": "13:00",
          "end_time": "16:00",
          "activity": "Afternoon activity",
          "location": "Location, City",
          "description": "Description",
          "duration": "3 hours"
        }},
        {{
          "time": "19:00",
          "end_time": "21:00",
          "activity": "Evening dining or activity",
          "location": "Restaurant/venue, City",
          "description": "Description",
          "duration": "2 hours"
        }}
      ]
    }}
  ],
  "tips": ["tip 1", "tip 2", "tip 3"],
  "total_budget": "Estimated budget range per person"
}}

IMPORTANT RULES:
- Generate ALL {num_days} days — do not stop early
- Use 24-hour time format for all times (e.g. "09:00", "14:30", "19:00")
- Be specific with location names for Google Maps navigation
- Use search results to populate activities where relevant
- If followup question (not a trip plan), return: {{"followup": true, "message": "your response"}}"""


async def format_response(
    recommendations: list[Recommendation],
    message: str,
    constraints: TripConstraints,
    llm: LLMProvider,
) -> ChatResponse:
    num_days = _extract_day_count(message)
    rec_text = "\n".join(
        f"- {r.title} ({r.category}) at {r.address or 'unknown'}: {r.description or ''}"
        for r in recommendations[:10]
    ) or "No search results — use your knowledge of the destination."

    messages = [
        {
            "role": "system",
            "content": "You are PlanCation travel planner. Always respond with valid JSON only. No markdown, no code blocks. Generate ALL requested days.",
        },
        {
            "role": "user",
            "content": FORMAT_PROMPT.format(
                message=message,
                num_days=num_days,
                constraints=constraints.model_dump_json(),
                recommendations=rec_text,
            ),
        },
    ]

    text = await llm.complete(messages)

    try:
        clean = text.strip().replace("```json", "").replace("```", "").strip()
        data = json.loads(clean)
        return ChatResponse(message=json.dumps(data), recommendations=recommendations[:10], constraints=constraints)
    except Exception:
        return ChatResponse(message=text, recommendations=recommendations[:10], constraints=constraints)