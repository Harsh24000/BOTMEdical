from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration, loaded from environment / .env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    groq_api_key: str = ""
    # Strong general model for the structured analysis (uses Groq JSON mode).
    # NOTE: llama-3.3-70b-versatile was deprecated by Groq (announced June 17,
    # 2026). openai/gpt-oss-120b is Groq's recommended replacement — it's
    # free-tier, has strong health-domain reasoning per OpenAI's model docs,
    # and supports the same JSON mode / structured outputs this app relies on.
    analysis_model: str = "openai/gpt-oss-120b"
    # groq/compound has built-in web search, enabling real medical research in chat.
    chat_model: str = "groq/compound"
    allowed_origins: str = "http://localhost:5173"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
