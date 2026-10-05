import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  RefreshCw,
  Server,
} from "lucide-react";

import { useApiResource } from "../../hooks/useApiResource";

import { getReports, getReportsStatus } from "../../services/reporting.service";

import type { ModuleStatus, ReportItem } from "../../types/reporting";

import "../../styles/reporting.css";

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatParameters(parameters: Record<string, unknown> | null) {
  if (!parameters) {
    return "";
  }

  return JSON.stringify(parameters, null, 2);
}

function ReportsPage() {
  const { data, loading, error, reload } =
    useApiResource<ReportItem[]>(getReports);

  const {
    data: moduleStatus,
    loading: statusLoading,
    reload: reloadStatus,
  } = useApiResource<ModuleStatus>(getReportsStatus);

  const reports = data ?? [];

  const readyReports = reports.filter(
    (report) => report.status.toLowerCase() === "ready",
  ).length;

  const filesAvailable = reports.filter((report) =>
    Boolean(report.file_url),
  ).length;

  function refreshAll() {
    void reload();
    void reloadStatus();
  }

  return (
    <section className="module-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">INFORMACIÓN EMPRESARIAL</span>

          <h1>Reportes</h1>

          <p>
            Consulta reportes empresariales registrados, sus parámetros, estado
            y archivos disponibles.
          </p>
        </div>

        <div className="module-main-icon">
          <FileText size={27} />
        </div>
      </div>

      <div className="reporting-summary">
        <div className="reporting-summary-card">
          <span>Reportes</span>

          <strong>{reports.length}</strong>
        </div>

        <div className="reporting-summary-card">
          <span>Estado ready</span>

          <strong>{readyReports}</strong>
        </div>

        <div className="reporting-summary-card">
          <span>Archivos disponibles</span>

          <strong>{filesAvailable}</strong>
        </div>
      </div>

      <article className="panel">
        <div className="reporting-toolbar">
          <div className="reporting-toolbar-info">
            <Server size={20} />

            <div>
              <h2>Registro de reportes</h2>

              <p>
                {statusLoading
                  ? "Consultando estado del módulo..."
                  : moduleStatus
                    ? `${moduleStatus.module}: ${moduleStatus.status}`
                    : "Información obtenida desde GET /reports."}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="secondary-button"
            disabled={loading || statusLoading}
            onClick={refreshAll}
          >
            <RefreshCw size={15} />
            Actualizar
          </button>
        </div>

        {loading ? (
          <div className="reporting-loading">Cargando reportes...</div>
        ) : error ? (
          <div className="reporting-error">
            <AlertTriangle size={16} />

            <span>{error}</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="reporting-empty">
            <div>
              <FileText size={28} />

              <strong>No existen reportes registrados</strong>

              <p>
                El módulo está disponible, pero actualmente no existen reportes
                para mostrar.
              </p>
            </div>
          </div>
        ) : (
          <div className="reporting-grid">
            {reports.map((report) => (
              <article key={report.id} className="reporting-card">
                <div className="reporting-card-header">
                  <div className="reporting-card-title">
                    <div className="reporting-card-icon">
                      <FileText size={17} />
                    </div>

                    <div>
                      <h3>{report.name}</h3>

                      <div
                        style={{
                          marginTop: 6,
                        }}
                      >
                        <span className="reporting-badge neutral">
                          {report.report_type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="reporting-badge success">
                    {report.status}
                  </span>
                </div>

                {report.parameters && (
                  <pre className="reporting-evidence">
                    {formatParameters(report.parameters)}
                  </pre>
                )}

                <div className="reporting-meta">
                  <span className="reporting-meta-item">
                    <CheckCircle2 size={12} />

                    {report.status}
                  </span>

                  <span className="reporting-meta-item">
                    <Clock3 size={12} />

                    {formatDate(report.created_at)}
                  </span>
                </div>

                {report.file_url && (
                  <div className="reporting-actions">
                    <a
                      className="reporting-link"
                      href={report.file_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink size={13} />
                      Abrir archivo
                    </a>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}

export default ReportsPage;
