from uuid import UUID

from fastapi import (

    APIRouter,

    Depends,
    Request,

    status,

)

from app.api.dependencies.auth import require_roles
from app.services.audit import (
    record_audit_event,
    snapshot,
)

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
    set_customer_archived,

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
    search: str | None = None,
    archived: bool = False,
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
        archived=archived,
    )



@router.post(

    "",

    response_model=CustomerResponse,

    status_code=status.HTTP_201_CREATED,

    summary="Crear cliente",

)

def register_customer(

    request: Request,
    data: CustomerCreateRequest,

    current_user: dict = Depends(

        require_roles(

            "Administrador",

            "Gerente",

            "Vendedor",

        )

    ),

):

    result = create_customer(
        data,
        current_user,
    )

    record_audit_event(
        action="customer.created",
        table_name="customers",
        record_id=result.id,
        current_user=current_user,
        request=request,
        new_data=snapshot(result),
    )

    return result



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

    request: Request,
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

    before = get_customer(
        customer_id,
        current_user,
    )

    result = update_customer(
        customer_id,
        data,
        current_user,
    )

    record_audit_event(
        action="customer.updated",
        table_name="customers",
        record_id=customer_id,
        current_user=current_user,
        request=request,
        old_data=snapshot(before),
        new_data=snapshot(result),
    )

    return result



@router.delete(

    "/{customer_id}",

    summary="Desactivar cliente",

)

def remove_customer(

    request: Request,
    customer_id: UUID,

    current_user: dict = Depends(

        require_roles(

            "Administrador",

            "Gerente",

        )

    ),

):

    before = get_customer(
        customer_id,
        current_user,
    )

    result = delete_customer(
        customer_id,
        current_user,
    )

    record_audit_event(
        action="customer.deactivated",
        table_name="customers",
        record_id=customer_id,
        current_user=current_user,
        request=request,
        old_data=snapshot(before),
        new_data=snapshot(result),
    )

    return result

@router.patch("/{customer_id}/archive", response_model=CustomerResponse, summary="Archivar cliente")
def archive_customer_endpoint(request: Request, customer_id: UUID, current_user: dict = Depends(require_roles("Administrador", "Gerente"))):
    before = get_customer(customer_id, current_user)
    result = set_customer_archived(customer_id, True, current_user)
    record_audit_event(action="customer.archived", table_name="customers", record_id=customer_id, current_user=current_user, request=request, old_data=snapshot(before), new_data=snapshot(result))
    return result

@router.patch("/{customer_id}/restore", response_model=CustomerResponse, summary="Restaurar cliente")
def restore_customer_endpoint(request: Request, customer_id: UUID, current_user: dict = Depends(require_roles("Administrador", "Gerente"))):
    before = get_customer(customer_id, current_user)
    result = set_customer_archived(customer_id, False, current_user)
    record_audit_event(action="customer.restored", table_name="customers", record_id=customer_id, current_user=current_user, request=request, old_data=snapshot(before), new_data=snapshot(result))
    return result
