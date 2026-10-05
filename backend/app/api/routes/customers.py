from uuid import UUID

from fastapi import (

    APIRouter,

    Depends,

    Query,

    status,

)

from app.api.dependencies.auth import require_roles

from app.schemas.commercial import (

    CustomerCreateRequest,

    CustomerHistoryItem,

    CustomerResponse,

    CustomerUpdateRequest,

)

from app.services.commercial import (

    create_customer,

    delete_customer,

    get_customer,

    get_customer_history,

    get_customers,

    update_customer,

)



router = APIRouter()



@router.get(

    "",

    response_model=list[CustomerResponse],

    summary="Listar clientes",

    description=(

        "Lista los clientes pertenecientes "

        "a la empresa del usuario autenticado."

    ),

)

def list_customers(
    search: str | None = Query(default=None, max_length=100),
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Vendedor",
        )
    ),
):
    return get_customers(
        current_user,
        search,
    )



@router.post(

    "",

    response_model=CustomerResponse,

    status_code=status.HTTP_201_CREATED,

    summary="Crear cliente",

)

def register_customer(

    data: CustomerCreateRequest,

    current_user: dict = Depends(

        require_roles(

            "Administrador",

            "Gerente",

            "Vendedor",

        )

    ),

):

    return create_customer(

        data,

        current_user,

    )



@router.get(

    "/{customer_id}/history",

    response_model=list[CustomerHistoryItem],

    summary="Historial comercial del cliente",

)

def customer_history(

    customer_id: UUID,

    current_user: dict = Depends(

        require_roles(

            "Administrador",

            "Gerente",

            "Vendedor",

        )

    ),

):

    return get_customer_history(

        customer_id,

        current_user,

    )



@router.get(

    "/{customer_id}",

    response_model=CustomerResponse,

    summary="Obtener cliente",

)

def read_customer(

    customer_id: UUID,

    current_user: dict = Depends(

        require_roles(

            "Administrador",

            "Gerente",

            "Vendedor",

        )

    ),

):

    return get_customer(

        customer_id,

        current_user,

    )



@router.put(

    "/{customer_id}",

    response_model=CustomerResponse,

    summary="Actualizar cliente",

)

def edit_customer(

    customer_id: UUID,

    data: CustomerUpdateRequest,

    current_user: dict = Depends(

        require_roles(

            "Administrador",

            "Gerente",

            "Vendedor",

        )

    ),

):

    return update_customer(

        customer_id,

        data,

        current_user,

    )



@router.delete(

    "/{customer_id}",

    summary="Desactivar cliente",

)

def remove_customer(

    customer_id: UUID,

    current_user: dict = Depends(

        require_roles(

            "Administrador",

            "Gerente",

        )

    ),

):

    return delete_customer(

        customer_id,

        current_user,

    )
