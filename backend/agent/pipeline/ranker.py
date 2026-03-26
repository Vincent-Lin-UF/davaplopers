from agent.core.schemas import Recommendation, TripConstraints
from dataclasses import dataclass

# private function of count keywrod matches
def _substring_match(text: str, keywords: set[str]) -> int:
    text_lower = text.lower().replace("_", " ")
    return sum(1 for kw in keywords if kw in text_lower)

@dataclass(frozen=True)
class RankWeights():
    category_weight: float = 3.0
    tag_weight: float = 1.0
    rec_weight: float = 0.5
    rec_bonus: float = 0.5
    

DEFAULT_WEIGHTS = RankWeights()

def rank(recommendations: list[Recommendation], constraints: TripConstraints, weights: RankWeights = DEFAULT_WEIGHTS) -> list[Recommendation]:
    interests_lower = {i.lower() for i in constraints.interests}
    dining_lower = {d.lower() for d in constraints.dining_preferences}
    all_prefs = interests_lower | dining_lower

    for rec in recommendations:
        score = 0.0

        score += _substring_match(rec.category, all_prefs) * weights.category_weight
        
        for tag in rec.tags: 
            score += _substring_match(tag, all_prefs) * weights.tag_weight

        if rec.description:
            score += _substring_match(rec.description, all_prefs) * weights.rec_weight
            score += weights.rec_bonus

        rec.score = round(score, 1)

    return sorted(recommendations, key=lambda r: r.score, reverse=True)
