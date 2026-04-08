# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ai-service/routers/decision_iq.py
# Router FastAPI pour la génération de situations Decision IQ via LLM
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
import os
import json
import random
import time

router = APIRouter(prefix="/decision-iq", tags=["Decision IQ"])

# ─── Modèles Pydantic ───────────────────────────────────────────────────────

PlayerPosition = Literal["PG", "SG", "SF", "PF", "C"]
Difficulty = Literal["easy", "medium", "hard"]
SituationCategory = Literal[
    "pick_and_roll", "transition", "half_court", "clutch",
    "isolation", "zone_offense", "press_break", "defense_reads"
]

class GenerateSituationRequest(BaseModel):
    position: PlayerPosition = "PG"
    difficulty: Difficulty = "medium"
    category: str = "all"   # "all" ou une catégorie spécifique
    user_level: str = "intermediate"

class DecisionOption(BaseModel):
    id: str
    label: str
    description: Optional[str] = None

class SituationResponse(BaseModel):
    id: str
    position: PlayerPosition
    category: str
    difficulty: Difficulty
    description: str
    imageUrl: Optional[str] = None
    options: List[DecisionOption]
    correctIndex: int = Field(ge=0, le=3)
    explanation: str
    tags: List[str] = []

class GenerateSituationResponse(BaseModel):
    success: bool
    situation: Optional[SituationResponse] = None
    error: Optional[str] = None
    source: str = "static"   # "llm" ou "static"

# ─── Mapping images Cloudinary par catégorie ────────────────────────────────
CLOUDINARY_BASE = "https://res.cloudinary.com/da2ju2dod/image/upload/v1/ankece/situations"

CATEGORY_IMAGES = {
    "pick_and_roll":  f"{CLOUDINARY_BASE}/pnr_court_diagram",
    "transition":     f"{CLOUDINARY_BASE}/transition_fastbreak",
    "half_court":     f"{CLOUDINARY_BASE}/halfcourt_offense",
    "clutch":         f"{CLOUDINARY_BASE}/clutch_moment",
    "isolation":      f"{CLOUDINARY_BASE}/isolation_wing",
    "zone_offense":   f"{CLOUDINARY_BASE}/zone_attack_diagram",
    "press_break":    f"{CLOUDINARY_BASE}/press_break_inbound",
    "defense_reads":  f"{CLOUDINARY_BASE}/defensive_rotation",
}

# ─── Prompts LLM ─────────────────────────────────────────────────────────────

def build_llm_prompt(request: GenerateSituationRequest) -> str:
    """
    Construit le prompt complet pour la génération d'une situation via LLM.
    Le prompt est en français pour coller au public cible de l'app.
    """
    category_str = f"de type '{request.category}'" if request.category != "all" else "variée (pick & roll, transition, clutch, isolation, etc.)"
    
    return f"""Tu es un expert en analyse tactique basketball NBA/WNBA avec 20 ans d'expérience comme coach.

Génère UNE situation de jeu réaliste et pédagogique en JSON pour un simulateur de prise de décision.

Paramètres :
- Position du joueur : {request.position}
- Difficulté : {request.difficulty} (easy=situations claires, medium=variées, hard=situations complexes multi-facteurs)
- Catégorie : {category_str}
- Niveau utilisateur : {request.user_level}

Génère exactement ce JSON (RIEN d'autre, juste le JSON brut) :

{{
  "description": "Description narrative de la situation en 2-3 phrases. Précise le score, le temps, les positions des joueurs, le défenseur. Le joueur doit se sentir dans la situation.",
  "options": [
    {{"id": "a", "label": "Option courte et claire", "description": "Explication de pourquoi choisir cette option"}},
    {{"id": "b", "label": "Option courte et claire", "description": "Explication"}},
    {{"id": "c", "label": "Option courte et claire", "description": "Explication"}},
    {{"id": "d", "label": "Option courte et claire", "description": "Explication"}}
  ],
  "correctIndex": 0,
  "explanation": "Explication tactique DÉTAILLÉE de 3-4 phrases. Cite un joueur NBA/WNBA si pertinent. Explique POURQUOI les autres options sont moins bonnes. Utilise les termes : spacing, help defense, weak side, tempo, mismatch, etc.",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "{request.category if request.category != 'all' else 'pick_and_roll'}"
}}

Règles :
- La bonne réponse (correctIndex) doit être aléatoire (pas toujours 0).
- Les mauvaises réponses doivent être PLAUSIBLES mais sous-optimales.
- L'explication doit enseigner réellement la tactique.
- Maximum 20 mots par option.
- Situation réaliste et immersive.
"""

# ─── Génération via LLM ──────────────────────────────────────────────────────

async def generate_via_openai(request: GenerateSituationRequest) -> Optional[dict]:
    """Génère une situation via OpenAI GPT (si clé disponible)."""
    try:
        import openai
        client = openai.AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        response = await client.chat.completions.create(
            model="gpt-4o-mini",    # Rapide et peu coûteux
            messages=[
                {"role": "system", "content": "Tu es un expert en tactique basketball. Réponds uniquement avec du JSON valide."},
                {"role": "user", "content": build_llm_prompt(request)}
            ],
            max_tokens=800,
            temperature=0.85,
            response_format={"type": "json_object"},
        )
        
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        print(f"[Decision IQ] OpenAI error: {e}")
        return None

async def generate_via_anthropic(request: GenerateSituationRequest) -> Optional[dict]:
    """Génère une situation via Claude Anthropic (fallback)."""
    try:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        
        message = await client.messages.create(
            model="claude-3-haiku-20240307",  # Rapide et peu coûteux
            max_tokens=800,
            messages=[
                {"role": "user", "content": build_llm_prompt(request)}
            ]
        )
        
        content = message.content[0].text
        # Extract JSON from response
        start = content.find("{")
        end = content.rfind("}") + 1
        if start >= 0 and end > start:
            return json.loads(content[start:end])
        return None
    except Exception as e:
        print(f"[Decision IQ] Anthropic error: {e}")
        return None

# ─── Situation statique de fallback ─────────────────────────────────────────

FALLBACK_SITUATIONS = [
    {
        "category": "pick_and_roll",
        "description": "P&R côté droit, défense en DROP. 3e quart, score égal. Ton pivot pose l'écran, le grand adverse recule bas. Ton défenseur passe au-dessus.",
        "options": [
            {"id": "a", "label": "Pull-up jumper mid-distance", "description": "Le défenseur en DROP laisse l'espace à mi-distance"},
            {"id": "b", "label": "Drive direct au cercle", "description": "Force le contact malgré la help defense"},
            {"id": "c", "label": "Lob au pivot en roll", "description": "Pass haute si le roll est libre"},
            {"id": "d", "label": "Reset – reviens en dribble", "description": "Resets l'attaque depuis le haut"},
        ],
        "correctIndex": 0,
        "explanation": "✅ En DROP defense, l'espace à mi-distance est OFFERT. C'est la sanction parfaite. Chris Paul tire ce pull-up avec 95% de conscience sur chaque P&R. Drive = tu tombes sur le grand. Lob = peu de chances avec l'aide.",
        "tags": ["pick_and_roll", "drop_defense", "pull_up"],
    },
    {
        "category": "clutch",
        "description": "-2, 8 secondes. Possession, timeout de l'adversaire. Leur meilleur défenseur est sur ton meneur. Tu es ailier, légèrement ouvert en wing droit.",
        "options": [
            {"id": "a", "label": "Demande le ballon – iso direct", "description": "Prends les responsabilités en 1v1"},
            {"id": "b", "label": "Coupe hard au cercle pour lay-up", "description": "Coupe backstoor pendant qu'ils s'organisent"},
            {"id": "c", "label": "P&R avec ton pivot pour créer une décision", "description": "Force la décision défensive"},
            {"id": "d", "label": "Corner 3 – repositionne-toi", "description": "Glisse en corner pour un catch & shoot"},
        ],
        "correctIndex": 2,
        "explanation": "✅ P&R en clutch force UNE décision immédiate : switch (mismatch), hedge (pass pivot), ou au-dessus (pull-up). -2 = tu peux scorer 2 ou 3 selon l'opportunité. L'iso seul contre leur meilleur défenseur = haute difficulté inutile. LeBron et Curry utilisent toujours le P&R dans les moments clutch.",
        "tags": ["clutch", "pick_and_roll", "decision_pressure"],
    },
]

# ─── Endpoint Principal ──────────────────────────────────────────────────────

@router.post("/generate-situation", response_model=GenerateSituationResponse)
async def generate_situation(request: GenerateSituationRequest):
    """
    Génère dynamiquement une situation de prise de décision via LLM.
    Cascade : OpenAI → Anthropic → Static fallback.
    """
    situation_data = None
    source = "static"

    # 1. Essaie OpenAI
    if os.getenv("OPENAI_API_KEY"):
        situation_data = await generate_via_openai(request)
        if situation_data:
            source = "llm_openai"

    # 2. Fallback Anthropic
    if not situation_data and os.getenv("ANTHROPIC_API_KEY"):
        situation_data = await generate_via_anthropic(request)
        if situation_data:
            source = "llm_anthropic"

    # 3. Fallback static
    if not situation_data:
        candidates = FALLBACK_SITUATIONS
        if request.category != "all":
            candidates = [s for s in FALLBACK_SITUATIONS if s["category"] == request.category]
        if not candidates:
            candidates = FALLBACK_SITUATIONS
        situation_data = random.choice(candidates)
        source = "static"

    # Validation et construction de la réponse
    try:
        category = situation_data.get("category", request.category if request.category != "all" else "pick_and_roll")
        
        situation = SituationResponse(
            id=f"diq_{int(time.time())}_{random.randint(1000, 9999)}",
            position=request.position,
            category=category,
            difficulty=request.difficulty,
            description=situation_data["description"],
            imageUrl=CATEGORY_IMAGES.get(category),
            options=[DecisionOption(**opt) for opt in situation_data["options"]],
            correctIndex=int(situation_data["correctIndex"]),
            explanation=situation_data["explanation"],
            tags=situation_data.get("tags", []),
        )

        return GenerateSituationResponse(
            success=True,
            situation=situation,
            source=source,
        )

    except Exception as e:
        print(f"[Decision IQ] Error building situation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to build situation: {str(e)}")


@router.get("/situations")
async def get_static_situations(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    limit: int = 10,
):
    """
    Retourne des situations pré-générées (cache/fallback).
    Utilisé en offline ou si le LLM est indisponible.
    """
    situations = FALLBACK_SITUATIONS.copy()
    
    if category and category != "all":
        situations = [s for s in situations if s.get("category") == category]
    
    random.shuffle(situations)
    
    return {
        "success": True,
        "count": len(situations[:limit]),
        "situations": situations[:limit],
    }
