import {
  Building2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import {
  getCompany,
} from "../../services/organization.service";

import {
  useApiResource,
} from "../../hooks/useApiResource";


function valueOrDash(
  value: string | null | undefined,
) {
  return value?.trim() || "No registrado";
}


export default function EmpresaPage() {
  const {
    data: company,
    loading,
    error,
    reload,
  } = useApiResource(
    getCompany,
  );

  if (loading) {
    return (
      <section className="dashboard-page">
        <div className="page-heading">
          <div>
            <span className="page-eyebrow">
              CONFIGURACIÓN ORGANIZACIONAL
            </span>

            <h1>Empresa</h1>

            <p>
              Cargando información empresarial...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="dashboard-page">
        <div className="page-heading">
          <div>
            <span className="page-eyebrow">
              CONFIGURACIÓN ORGANIZACIONAL
            </span>

            <h1>Empresa</h1>

            <p>{error}</p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={() => void reload()}
          >
            <RefreshCw size={17} />
            Reintentar
          </button>
        </div>
      </section>
    );
  }

  if (!company) {
    return (
      <section className="dashboard-page">
        <div className="page-heading">
          <div>
            <h1>Empresa</h1>
            <p>
              No existe información empresarial.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">
            CONFIGURACIÓN ORGANIZACIONAL
          </span>

          <h1>Empresa</h1>

          <p>
            Información de la organización
            asociada al usuario autenticado.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => void reload()}
        >
          <RefreshCw size={17} />
          Actualizar
        </button>
      </div>

      <div className="stats-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="panel-label">
                EMPRESA
              </span>
              <h3>{company.name}</h3>
            </div>

            <Building2 size={20} />
          </div>

          <p>
            {valueOrDash(
              company.business_name,
            )}
          </p>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="panel-label">
                IDENTIFICACIÓN
              </span>
              <h3>RUC / Tax ID</h3>
            </div>

            <ShieldCheck size={20} />
          </div>

          <p>
            {valueOrDash(
              company.tax_id,
            )}
          </p>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="panel-label">
                ESTADO
              </span>
              <h3>
                {company.status === "active"
                  ? "Activa"
                  : "Inactiva"}
              </h3>
            </div>

            <ShieldCheck size={20} />
          </div>
        </article>
      </div>

      <div className="dashboard-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="panel-label">
                CONTACTO
              </span>

              <h3>
                Información empresarial
              </h3>
            </div>
          </div>

          <div className="dashboard-list">
            <div className="dashboard-list-item">
              <div>
                <strong>
                  <Mail size={15} /> Correo
                </strong>
                <span>
                  {valueOrDash(
                    company.email,
                  )}
                </span>
              </div>
            </div>

            <div className="dashboard-list-item">
              <div>
                <strong>
                  <Phone size={15} /> Teléfono
                </strong>
                <span>
                  {valueOrDash(
                    company.phone,
                  )}
                </span>
              </div>
            </div>

            <div className="dashboard-list-item">
              <div>
                <strong>
                  <MapPin size={15} /> Dirección
                </strong>
                <span>
                  {valueOrDash(
                    company.address,
                  )}
                </span>
              </div>
            </div>

            <div className="dashboard-list-item">
              <div>
                <strong>
                  Ciudad / País
                </strong>
                <span>
                  {[
                    company.city,
                    company.country,
                  ]
                    .filter(Boolean)
                    .join(", ") ||
                    "No registrado"}
                </span>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
