import ssl
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker

from app.core.config import settings


def _build_engine():
    database_url = str(
        settings.DATABASE_URL
    )

    try:
        return create_engine(
            database_url,
            pool_pre_ping=True,
        )

    except ImportError as exc:
        message = str(exc).lower()

        if (
            "pq wrapper" not in message
            and
            "psycopg" not in message
        ):
            raise

        # Windows está bloqueando la DLL nativa
        # utilizada por psycopg.
        #
        # Para desarrollo local utilizamos pg8000.

        url = make_url(
            database_url
        )

        query = dict(
            url.query
        )

        connect_timeout = query.pop(
            "connect_timeout",
            None,
        )

        # Parámetros de libpq que pg8000
        # no acepta como parámetros URL.
        for key in (
            "sslmode",
            "sslrootcert",
            "channel_binding",
            "gssencmode",
            "target_session_attrs",
            "keepalives",
            "keepalives_idle",
            "keepalives_interval",
            "keepalives_count",
        ):
            query.pop(
                key,
                None,
            )

        fallback_url = url.set(
            drivername="postgresql+pg8000",
            query=query,
        )

        # TLS sigue activo.
        # Equivalente práctico a sslmode=require:
        # cifra, pero no valida CA ni hostname.
        ssl_context = ssl.SSLContext(
            ssl.PROTOCOL_TLS_CLIENT
        )

        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE

        connect_args = {
            "ssl_context":
                ssl_context,
        }

        if connect_timeout:
            try:
                connect_args[
                    "timeout"
                ] = float(
                    connect_timeout
                )
            except (
                TypeError,
                ValueError,
            ):
                pass

        return create_engine(
            fallback_url,
            pool_pre_ping=True,
            connect_args=
                connect_args,
        )

engine = _build_engine()


SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
