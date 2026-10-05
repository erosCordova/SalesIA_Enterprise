import {
  AlertTriangle,
  FileClock,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { useApiResource } from "../../hooks/useApiResource";
import { getAuditEvents } from "../../services/reporting.service";
import type { AuditEvent } from "../../types/reporting";
import "../../styles/reporting.css";

const actionLabels: Record<string, string> = {
  "user.created": "Creó un usuario",
  "company.updated": "Actualizó los datos de la empresa",
  "branch.created": "Creó una sucursal",
  "branch.updated": "Actualizó una sucursal",
  "customer.created": "Registró un cliente",
  "customer.updated": "Actualizó un cliente",
  "customer.deactivated": "Desactivó un cliente",
  "category.created": "Creó una categoría",
  "category.updated": "Actualizó una categoría",
  "category.deactivated": "Desactivó una categoría",
  "product.created": "Creó un producto",
  "product.updated": "Actualizó un producto",
  "product.deactivated": "Desactivó un producto",
  "sale.created": "Registró una venta",
  "report.generated": "Generó un reporte",
  "report.downloaded": "Descargó un reporte",
};

const resourceLabels: Record<string, string> = {
  users: "Usuario",
  companies: "Empresa",
  branches: "Sucursal",
  customers: "Cliente",
  categories: "Categoría",
  products: "Producto",
  sales: "Venta",
  reports: "Reporte",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function AuditPage() {
  const { data, loading, error, reload } =
    useApiResource<AuditEvent[]>(getAuditEvents);

  return (
    <section className="module-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">CONTROL Y TRAZABILIDAD</span>
          <h1>Auditoría</h1>
          <p>Consulta quién realizó cambios importantes y cuándo ocurrieron.</p>
        </div>
        <div className="module-main-icon"><ShieldCheck size={27} /></div>
      </div>

      <article className="panel">
        <div className="reporting-toolbar">
          <div className="reporting-toolbar-info">
            <FileClock size={20} />
            <div>
              <h2>Acciones recientes</h2>
              <p>Se muestran hasta 100 acciones de tu empresa.</p>
            </div>
          </div>
          <button
            type="button"
            className="secondary-button"
            disabled={loading}
            onClick={() => void reload()}
          >
            <RefreshCw size={15} /> Actualizar
          </button>
        </div>

        {loading ? (
          <div className="reporting-loading">Consultando el historial…</div>
        ) : error ? (
          <div className="reporting-error">
            <AlertTriangle size={16} /><span>{error}</span>
          </div>
        ) : data?.length ? (
          <div className="audit-table-wrap">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Acción</th>
                  <th>Sección</th>
                  <th>Realizada por</th>
                  <th>Fecha y hora</th>
                </tr>
              </thead>
              <tbody>
                {data.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <strong>{actionLabels[event.action] ?? "Acción registrada"}</strong>
                      {event.record_id && (
                        <span className="audit-record">Referencia: {event.record_id.slice(0, 8)}</span>
                      )}
                    </td>
                    <td>{resourceLabels[event.table_name ?? ""] ?? "General"}</td>
                    <td>
                      <strong>{event.actor_name}</strong>
                      {event.actor_role && <span className="audit-record">{event.actor_role}</span>}
                    </td>
                    <td>{formatDate(event.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="reporting-empty">
            <div>
              <ShieldCheck size={28} />
              <strong>Aún no hay acciones registradas</strong>
              <p>Los cambios importantes aparecerán aquí cuando se realicen.</p>
            </div>
          </div>
        )}
      </article>
    </section>
  );
}

export default AuditPage;
