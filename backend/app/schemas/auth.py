from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    dni: str = Field(
        ...,
        min_length=8,
        max_length=8,
        pattern=r"^[0-9]{8}$",
        examples=["00000001"],
        description="DNI de 8 dígitos del usuario.",
    )

    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description=(
            "Contraseña asignada al usuario "
            "por el administrador."
        ),
    )


class UserResponse(BaseModel):
    id: str
    auth_user_id: str
    company_id: str
    customer_id: str | None = None

    dni: str
    first_name: str
    last_name: str

    email: str | None = None

    role: str
    company: str
    status: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int | None = None
    user: UserResponse
