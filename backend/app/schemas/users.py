from typing import Literal

from pydantic import BaseModel, Field, field_validator


RoleName = Literal[
    "Administrador",
    "Gerente",
    "Vendedor",
    "Analista",
    "Almacén",
]

UserStatus = Literal[
    "active",
    "inactive",
]


class UserCreateRequest(BaseModel):
    dni: str = Field(
        ...,
        min_length=8,
        max_length=8,
        pattern=r"^[0-9]{8}$",
        examples=["12345678"],
        description="DNI de 8 dígitos del usuario.",
    )

    first_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    last_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
    )

    role: RoleName

    phone: str | None = Field(
        default=None,
        max_length=30,
    )

    status: UserStatus = "active"

    @field_validator("first_name", "last_name", mode="before")
    @classmethod
    def trim_personal_names(cls, value):
        if isinstance(value, str):
            value = value.strip()
        return value

    @field_validator("password")
    @classmethod
    def reject_blank_password(cls, value):
        if not value.strip():
            raise ValueError("La contraseña no puede contener solo espacios.")
        return value


class UserCreatedResponse(BaseModel):
    id: str
    auth_user_id: str
    dni: str
    first_name: str
    last_name: str
    phone: str | None
    role: str
    company: str
    status: str


class UserListItem(BaseModel):
    id: str
    dni: str
    first_name: str
    last_name: str
    phone: str | None
    role: str
    company: str
    status: str


class RoleResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
