from typing import Literal

from pydantic import BaseModel, Field


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


class UserUpdateRequest(BaseModel):
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

    role: RoleName

    phone: str | None = Field(
        default=None,
        max_length=30,
    )

    status: UserStatus


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
