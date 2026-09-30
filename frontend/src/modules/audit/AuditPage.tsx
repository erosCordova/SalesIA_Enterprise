import {
  AlertTriangle,
  CheckCircle2,
  FileClock,
  Info,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import {
  useApiResource,
} from "../../hooks/useApiResource";

import {
  getAuditStatus,
} from "../../services/reporting.service";

import type {
  ModuleStatus,
} from "../../types/reporting";

import "../../styles/reporting.css";


function AuditPage() {
  const {
    data,
    loading,
    error,
    reload,
  } =
    useApiResource<ModuleStatus>(
      getAuditStatus,
    );


  return (
    <section className="module-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">
            CONTROL Y TRAZABILIDAD
          </span>

          <h1>
            Auditoría
          </h1>

          <p>
            Supervisa la disponibilidad
            del módulo de auditoría y
            trazabilidad de SalesIA
            Enterprise.
          </p>
        </div>

        <div className="module-main-icon">
          <ShieldCheck
            size={27}
          />
        </div>
      </div>


      <article className="panel">
        <div className="reporting-toolbar">
          <div className="reporting-toolbar-info">
            <FileClock
              size={20}
            />

            <div>
              <h2>
                Estado del módulo
              </h2>

              <p>
                Información consultada
                directamente desde
                GET /audit/status.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="secondary-button"
            disabled={loading}
            onClick={() => {
              void reload();
            }}
          >
            <RefreshCw
              size={15}
            />

            Actualizar
          </button>
        </div>


        {loading ? (
          <div className="reporting-loading">
            Consultando auditoría...
          </div>
        ) : error ? (
          <div className="reporting-error">
            <AlertTriangle
              size={16}
            />

            <span>
              {error}
            </span>
          </div>
        ) : data ? (
          <>
            <div className="audit-status-card">
              <div className="audit-status-icon">
                <ShieldCheck
                  size={27}
                />
              </div>

              <div>
                <span className="reporting-badge success">
                  {data.status}
                </span>

                <h2
                  style={{
                    marginTop: 8,
                  }}
                >
                  {data.module}
                </h2>

                <p>
                  El backend confirmó
                  correctamente la
                  disponibilidad del
                  módulo.
                </p>
              </div>
            </div>


            <div className="audit-contract-note">
              <Info
                size={17}
              />

              <div>
                <strong>
                  Contrato actual del backend
                </strong>

                <div
                  style={{
                    marginTop: 4,
                  }}
                >
                  La API disponible en esta
                  fase expone el estado del
                  módulo de auditoría mediante
                  /audit/status. Esta pantalla
                  no fabrica eventos ni
                  registros de auditoría que
                  todavía no sean entregados
                  por el backend.
                </div>
              </div>
            </div>


            <div
              className="analytics-success"
              style={{
                marginTop: 16,
                marginBottom: 0,
              }}
            >
              <CheckCircle2
                size={15}
              />

              Comunicación con auditoría
              verificada.
            </div>
          </>
        ) : (
          <div className="reporting-empty">
            <div>
              <ShieldCheck
                size={28}
              />

              <strong>
                Sin información disponible
              </strong>

              <p>
                No se recibió información
                del estado de auditoría.
              </p>
            </div>
          </div>
        )}
      </article>
    </section>
  );
}


export default AuditPage;
