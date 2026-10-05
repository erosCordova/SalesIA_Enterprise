from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "SalesIA Enterprise"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str

    SUPABASE_URL: str
    SUPABASE_PUBLISHABLE_KEY: str
    SUPABASE_SECRET_KEY: str = ""

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    CORS_ORIGINS: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @model_validator(mode="after")
    def validate_production_secrets(self):
        if self.ENVIRONMENT.strip().lower() not in {"production", "prod"}:
            return self

        if self.DEBUG:
            raise ValueError("DEBUG debe estar desactivado en producción.")

        secret = self.SECRET_KEY.strip()
        placeholder_markers = ("replace", "generate", "change-me", "placeholder")
        if len(secret) < 32 or any(
            marker in secret.lower() for marker in placeholder_markers
        ):
            raise ValueError(
                "SECRET_KEY debe ser una clave aleatoria de al menos 32 caracteres en producción."
            )

        if not self.SUPABASE_SECRET_KEY.strip():
            raise ValueError(
                "SUPABASE_SECRET_KEY es obligatorio para la administración de cuentas en producción."
            )

        return self

    @property
    def cors_origins_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
