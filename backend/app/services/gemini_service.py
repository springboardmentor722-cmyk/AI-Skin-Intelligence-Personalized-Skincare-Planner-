import json
from typing import Any, Optional

from google import genai
from google.genai import types

from app.config import get_gemini_api_key


# Keep this explicit stable model aligned with the current Gemini API model list.
GEMINI_MODEL = "gemini-3.6-flash"


class GeminiServiceError(RuntimeError):
    """A safe error type that never includes provider credentials."""


class GeminiService:
    def __init__(self) -> None:
        try:
            self.client = genai.Client(api_key=get_gemini_api_key())
        except RuntimeError:
            raise
        except Exception as error:
            raise GeminiServiceError("Gemini client could not be initialized.") from error

    def generate_text(self, prompt: str, timeout_ms: int = 30000) -> str:
        if not prompt or not prompt.strip():
            raise GeminiServiceError("A prompt is required.")
        try:
            response = self.client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt.strip(),
                config=types.GenerateContentConfig(http_options=types.HttpOptions(timeout=timeout_ms)),
            )
            text = (response.text or "").strip()
            if not text:
                raise GeminiServiceError("Gemini returned an empty response.")
            return text
        except GeminiServiceError:
            raise
        except Exception as error:
            raise GeminiServiceError("Gemini request failed. Check service availability and try again.") from error

    def generate_json(self, prompt: str, response_schema: Optional[dict[str, Any]] = None, timeout_ms: int = 30000) -> dict[str, Any]:
        if not prompt or not prompt.strip():
            raise GeminiServiceError("A prompt is required.")
        try:
            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=response_schema,
                http_options=types.HttpOptions(timeout=timeout_ms),
            )
            response = self.client.models.generate_content(model=GEMINI_MODEL, contents=prompt.strip(), config=config)
            parsed = json.loads((response.text or "").strip())
            if not isinstance(parsed, dict):
                raise GeminiServiceError("Gemini returned an unexpected JSON structure.")
            return parsed
        except GeminiServiceError:
            raise
        except json.JSONDecodeError as error:
            raise GeminiServiceError("Gemini returned malformed JSON.") from error
        except Exception as error:
            raise GeminiServiceError("Gemini request failed. Check service availability and try again.") from error


def get_gemini_service() -> GeminiService:
    return GeminiService()


def analyze_skin_condition(prompt: str, response_schema: dict[str, Any]) -> dict[str, Any]:
    """Run a structured, non-diagnostic skin-condition support analysis."""
    return get_gemini_service().generate_json(prompt, response_schema)
