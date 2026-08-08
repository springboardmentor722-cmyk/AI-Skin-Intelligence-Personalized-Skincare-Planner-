"""
Groq Vision Service.
The LLM-based analysis is a BACKUP only. The primary scoring method is the
rule-based DynamicFallbackScorer which uses the user's actual questionnaire data.
The Groq API is called only when it is configured AND reachable.
"""
import os
import json
import base64
from typing import Optional
from uuid import UUID
from fastapi import HTTPException
from sqlalchemy.orm import Session
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class GroqVisionService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.client = None
        if self.api_key:
            try:
                from groq import Groq
                self.client = Groq(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Could not initialise Groq client: {e}")

    def analyze_skin_image(
        self,
        base64_image: str,
        db: Optional[Session] = None,
        user_id: Optional[UUID] = None,
    ) -> dict:
        """
        Analyse a skin image.

        Priority order (NO LLM by default):
        1. **Primary** — Rule-based DynamicFallbackScorer (always available)
        2. **Backup**  — Groq Vision LLM (only if API key set AND API reachable)

        The LLM result, when available, is merged: the LLM's overall_score is
        averaged with the rule-based score so the system never fully depends on
        an external API.
        """
        from app.services.dynamic_fallback_scorer import DynamicFallbackScorer

        # ── Step 1: Always compute the rule-based score first ────────────
        rule_based_result = DynamicFallbackScorer.calculate(db=db, user_id=user_id)

        # ── Step 2: Attempt LLM backup if configured ─────────────────────
        if not self.client:
            logger.info("No Groq API key — returning rule-based dynamic score.")
            return rule_based_result

        # Ensure base64 string doesn't have the data URL prefix for the API payload
        # Some frontend canvases might send "data:image/jpeg;base64,..."
        clean_b64 = base64_image
        if "," in clean_b64:
            clean_b64 = clean_b64.split(",")[1]

        prompt = """
        You are an expert AI dermatologist and skincare consultant.
        Analyze the provided image of a person's face/skin. 
        CRITICAL INSTRUCTIONS: 
        1. If the skin is clear with no visible blemishes, do NOT hallucinate acne or oiliness. You must return concerns like "Clear Skin" or "Normal".
        2. If you see severe red bumps, papules, or pustules, you MUST explicitly identify "Acne", "Breakouts", or "Severe Acne". Do NOT just call it "Oily T-Zone".
        3. Identify any redness, dryness, hyperpigmentation, or fine lines accurately.
        
        Respond ONLY with a valid JSON object in the following format:
        {
            "overall_score": <integer from 1 to 100 representing overall skin health>,
            "detected_concerns": ["<concern 1>", "<concern 2>"],
            "recommendations": ["<recommendation 1>", "<recommendation 2>"]
        }
        """

        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{clean_b64}",
                                },
                            },
                        ],
                    }
                ],
                model="llama-3.2-90b-vision-preview",
                response_format={"type": "json_object"},
                temperature=0.2,
                max_tokens=500,
            )

            content = chat_completion.choices[0].message.content
            llm_result = json.loads(content)

            # Merge: average the scores, prefer LLM concerns if present
            merged_score = int(
                (rule_based_result["overall_score"] * 0.4)
                + (llm_result.get("overall_score", rule_based_result["overall_score"]) * 0.6)
            )

            return {
                "overall_score": merged_score,
                "detected_concerns": llm_result.get("detected_concerns", rule_based_result["detected_concerns"]),
                "recommendations": llm_result.get("recommendations", rule_based_result["recommendations"]),
                "scoring_method": "hybrid_llm_backup",
            }

        except Exception as e:
            logger.error(f"Groq Vision API backup failed: {str(e)}")
            # LLM backup failed — return the rule-based result (already computed)
            logger.info("Returning rule-based dynamic score as LLM backup is unavailable.")
            return rule_based_result


groq_vision_service = GroqVisionService()
