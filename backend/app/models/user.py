"""
Compatibilidad con código que importa:

    from app.models.user import User

El modelo real de la tabla public.users se encuentra
en app.models.security.
"""

from app.models.security import User

__all__ = ["User"]
