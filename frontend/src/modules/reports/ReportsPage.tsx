import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Printer,
  RefreshCw,
  Server,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  useApiResource,
} from "../../hooks/useApiResource";

import {
  downloadReport,
  generateReport,
  getReports,
  getReportsStatus,
} from "../../services/reporting.service";

import type {
  ModuleStatus,
  ReportGenerateRequest,
  ReportItem,
  ReportType,
} from "../../types/reporting";

import "../../styles/reporting.css";


const REPORT_TYPE_LABELS:
  Record<ReportType, string> = {
  sales:
    "Reporte de ventas",

  statistical:
    "Reporte estadístico",

  products:
    "Reporte de productos",

  customers:
    "Reporte de clientes",

  employees:
    "Reporte de vendedores",
};


function formatDate(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "es-PE",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}


function formatParameters(
  parameters:
    | Record<string, unknown>
    | null,
) {
  if (!parameters) {
    return "";
  }

  return JSON.stringify(
    parameters,
    null,
    2,
  );
}


/**
 * Convierte un CSV en una matriz
 * respetando valores entre comillas.
 */
function parseCSV(
  csv: string,
): string[][] {
  const rows: string[][] = [];

  let row: string[] = [];
  let value = "";
  let insideQuotes = false;

  for (
    let i = 0;
    i < csv.length;
    i += 1
  ) {
    const character =
      csv[i];

    const nextCharacter =
      csv[i + 1];

    if (
      character === '"' &&
      insideQuotes &&
      nextCharacter === '"'
    ) {
      value += '"';
      i += 1;
      continue;
    }

    if (
      character === '"'
    ) {
      insideQuotes =
        !insideQuotes;
      continue;
    }

    if (
      character === "," &&
      !insideQuotes
    ) {
      row.push(value);
      value = "";
      continue;
    }

    if (
      (
        character === "\n" ||
        character === "\r"
      ) &&
      !insideQuotes
    ) {
      if (
        character === "\r" &&
        nextCharacter === "\n"
      ) {
        i += 1;
      }

      row.push(value);
      value = "";

      if (
        row.some(
          (item) =>
            item.trim() !== "",
        )
      ) {
        rows.push(row);
      }

      row = [];
      continue;
    }

    value += character;
  }

  if (
    value.length > 0 ||
    row.length > 0
  ) {
    row.push(value);

    if (
      row.some(
        (item) =>
          item.trim() !== "",
      )
    ) {
      rows.push(row);
    }
  }

  return rows;
}


function printReportData(
  report: ReportItem,
  csv: string,
) {
  const rows =
    parseCSV(csv);

  const printWindow =
    window.open(
      "",
      "_blank",
      "width=1200,height=800",
    );

  if (!printWindow) {
    throw new Error(
      "El navegador bloqueó la ventana de impresión.",
    );
  }

  const headers =
    rows[0] ?? [];

  const bodyRows =
    rows.slice(1);

  const tableHeader =
    headers
      .map(
        (header) =>
          `<th>${header}</th>`,
      )
      .join("");

  const tableBody =
    bodyRows
      .map(
        (row) => `
          <tr>
            ${row
              .map(
                (cell) =>
                  `<td>${cell}</td>`,
              )
              .join("")}
          </tr>
        `,
      )
      .join("");

  printWindow.document.write(`
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />

        <title>
          ${report.name}
        </title>

        <style>
          body {
            font-family:
              Arial,
              sans-serif;

            margin: 40px;

            color: #172033;
          }

          h1 {
            margin-bottom: 6px;
          }

          .subtitle {
            color: #64748b;
            margin-bottom: 24px;
          }

          .metadata {
            margin-bottom: 24px;
            padding: 16px;

            border:
              1px solid #e2e8f0;

            border-radius: 8px;

            background: #f8fafc;
          }

          table {
            width: 100%;
            border-collapse:
              collapse;

            font-size: 12px;
          }

          th,
          td {
            border:
              1px solid #cbd5e1;

            padding: 8px;

            text-align: left;
          }

          th {
            background: #f1f5f9;
            font-weight: 700;
          }

          .footer {
            margin-top: 30px;

            color: #64748b;

            font-size: 11px;
          }

          @media print {
            body {
              margin: 20px;
            }
          }
        </style>
      </head>

      <body>
        <h1>
          ${report.name}
        </h1>

        <div class="subtitle">
          SalesIA Enterprise
        </div>

        <div class="metadata">
          <strong>Tipo:</strong>
          ${REPORT_TYPE_LABELS[
            report.report_type as ReportType
          ] ?? report.report_type}
          <br />

          <strong>Estado:</strong>
          ${report.status}
          <br />

          <strong>Fecha:</strong>
          ${formatDate(
            report.created_at,
          )}
        </div>

        <table>
          <thead>
            <tr>
              ${tableHeader}
            </tr>
          </thead>

          <tbody>
            ${tableBody}
          </tbody>
        </table>

        <div class="footer">
          Reporte generado por
          SalesIA Enterprise.
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();

  printWindow.focus();

  printWindow.onload = () => {
    printWindow.print();
  };
}


function ReportsPage() {
  const {
    data,
    loading,
    error,
    reload,
  } =
    useApiResource<ReportItem[]>(
      getReports,
    );

  const {
    data: moduleStatus,
    loading: statusLoading,
    reload: reloadStatus,
  } =
    useApiResource<ModuleStatus>(
      getReportsStatus,
    );


  const reports =
    data ?? [];


  const [
    reportType,
    setReportType,
  ] =
    useState<ReportType>(
      "sales",
    );


  const [
    startDate,
    setStartDate,
  ] =
    useState("");


  const [
    endDate,
    setEndDate,
  ] =
    useState("");


  const [
    generating,
    setGenerating,
  ] =
    useState(false);


  const [
    actionError,
    setActionError,
  ] =
    useState("");


  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState("");


  const readyReports =
    reports.filter(
      (report) =>
        report.status
          .toLowerCase() ===
        "ready",
    ).length;


  const filesAvailable =
    reports.filter(
      (report) =>
        Boolean(
          report.file_url,
        ),
    ).length;


  function refreshAll() {
    void reload();
    void reloadStatus();
  }


  async function handleGenerate(
    event:
      React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setActionError("");
    setSuccessMessage("");

    if (
      startDate &&
      endDate &&
      startDate > endDate
    ) {
      setActionError(
        "La fecha inicial no puede ser posterior a la fecha final.",
      );

      return;
    }

    setGenerating(true);

    const payload:
      ReportGenerateRequest = {
      report_type:
        reportType,

      start_date:
        startDate || null,

      end_date:
        endDate || null,

      employee_id:
        null,

      category_id:
        null,

      name:
        null,
    };

    try {
      await generateReport(
        payload,
      );

      setSuccessMessage(
        "El reporte se generó correctamente.",
      );

      await reload();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "No se pudo generar el reporte.",
      );
    } finally {
      setGenerating(false);
    }
  }


  async function handleDownload(
    report: ReportItem,
  ) {
    setActionError("");

    try {
      const blob =
        await downloadReport(
          report.id,
        );

      const url =
        URL.createObjectURL(
          blob,
        );

      const link =
        document.createElement(
          "a",
        );

      link.href = url;

      link.download =
        `${report.name.replace(
          /\s+/g,
          "-",
        )}-${report.id}.csv`;

      document.body.appendChild(
        link,
      );

      link.click();

      link.remove();

      URL.revokeObjectURL(
        url,
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "No se pudo descargar el reporte.",
      );
    }
  }


  async function handlePrint(
    report: ReportItem,
  ) {
    setActionError("");

    try {
      const blob =
        await downloadReport(
          report.id,
        );

      const csv =
        await blob.text();

      printReportData(
        report,
        csv,
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "No se pudo preparar la impresión.",
      );
    }
  }


  return (
    <section className="module-page">

      <div className="page-heading">
        <div>
          <span className="page-eyebrow">
            INFORMACIÓN EMPRESARIAL
          </span>

          <h1>
            Reportes
          </h1>

          <p>
            Genera, consulta,
            descarga e imprime
            reportes comerciales y
            estadísticos.
          </p>
        </div>

        <div className="module-main-icon">
          <FileText
            size={27}
          />
        </div>
      </div>


      <div className="reporting-summary">

        <div className="reporting-summary-card">
          <span>
            Reportes
          </span>

          <strong>
            {reports.length}
          </strong>
        </div>


        <div className="reporting-summary-card">
          <span>
            Listos
          </span>

          <strong>
            {readyReports}
          </strong>
        </div>


        <div className="reporting-summary-card">
          <span>
            Archivos
          </span>

          <strong>
            {filesAvailable}
          </strong>
        </div>

      </div>


      <article className="panel">

        <div className="reporting-toolbar">

          <div className="reporting-toolbar-info">

            <Server
              size={20}
            />

            <div>
              <h2>
                Generar reporte
              </h2>

              <p>
                Selecciona el tipo y
                el periodo de análisis.
              </p>
            </div>

          </div>

        </div>


        <form
          className="reporting-form"
          onSubmit={
            handleGenerate
          }
        >

          <div className="reporting-field">

            <label htmlFor="report-type">
              Tipo de reporte
            </label>

            <select
              id="report-type"
              value={reportType}
              onChange={(event) =>
                setReportType(
                  event.target.value as ReportType,
                )
              }
            >
              <option value="sales">
                Reporte de ventas
              </option>

              <option value="statistical">
                Reporte estadístico
              </option>

              <option value="products">
                Reporte de productos
              </option>

              <option value="customers">
                Reporte de clientes
              </option>

              <option value="employees">
                Reporte de vendedores
              </option>
            </select>

          </div>


          <div className="reporting-field">

            <label htmlFor="start-date">
              Fecha inicial
            </label>

            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(event) =>
                setStartDate(
                  event.target.value,
                )
              }
            />

          </div>


          <div className="reporting-field">

            <label htmlFor="end-date">
              Fecha final
            </label>

            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(event) =>
                setEndDate(
                  event.target.value,
                )
              }
            />

          </div>


          <div className="reporting-form-actions">

            <button
              type="submit"
              className="primary-button"
              disabled={generating}
            >
              <FileText
                size={15}
              />

              {generating
                ? "Generando..."
                : "Generar reporte"}
            </button>

          </div>

        </form>


        {actionError && (
          <div className="reporting-error">
            <AlertTriangle
              size={16}
            />

            <span>
              {actionError}
            </span>
          </div>
        )}


        {successMessage && (
          <div className="reporting-success">
            <CheckCircle2
              size={16}
            />

            <span>
              {successMessage}
            </span>
          </div>
        )}

      </article>


      <article className="panel">

        <div className="reporting-toolbar">

          <div className="reporting-toolbar-info">

            <Server
              size={20}
            />

            <div>

              <h2>
                Historial de reportes
              </h2>

              <p>
                {statusLoading
                  ? "Consultando estado del módulo..."
                  : moduleStatus
                    ? `${moduleStatus.module}: ${moduleStatus.status}`
                    : "Reportes registrados en el sistema."}
              </p>

            </div>

          </div>


          <button
            type="button"
            className="secondary-button"
            disabled={
              loading ||
              statusLoading
            }
            onClick={
              refreshAll
            }
          >

            <RefreshCw
              size={15}
            />

            Actualizar

          </button>

        </div>


        {loading ? (
          <div className="reporting-loading">
            Cargando reportes...
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
        ) : reports.length === 0 ? (
          <div className="reporting-empty">

            <div>

              <FileText
                size={28}
              />

              <strong>
                No existen reportes registrados
              </strong>

              <p>
                Genera tu primer reporte
                utilizando el formulario
                superior.
              </p>

            </div>

          </div>
        ) : (
          <div className="reporting-grid">

            {reports.map(
              (report) => (

                <article
                  key={report.id}
                  className="reporting-card"
                >

                  <div className="reporting-card-header">

                    <div className="reporting-card-title">

                      <div className="reporting-card-icon">

                        <FileText
                          size={17}
                        />

                      </div>


                      <div>

                        <h3>
                          {report.name}
                        </h3>

                        <div
                          style={{
                            marginTop: 6,
                          }}
                        >

                          <span className="reporting-badge neutral">
                            {REPORT_TYPE_LABELS[
                              report.report_type as ReportType
                            ] ??
                              report.report_type}
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
                      {formatParameters(
                        report.parameters,
                      )}
                    </pre>
                  )}


                  <div className="reporting-meta">

                    <span className="reporting-meta-item">

                      <CheckCircle2
                        size={12}
                      />

                      {report.status}

                    </span>


                    <span className="reporting-meta-item">

                      <Clock3
                        size={12}
                      />

                      {formatDate(
                        report.created_at,
                      )}

                    </span>

                  </div>


                  {report.file_url && (
                    <div className="reporting-actions">

                      <button
                        type="button"
                        className="reporting-link"
                        onClick={() =>
                          void handleDownload(
                            report,
                          )
                        }
                      >

                        <Download
                          size={13}
                        />

                        Descargar

                      </button>


                      <button
                        type="button"
                        className="reporting-link"
                        onClick={() =>
                          void handlePrint(
                            report,
                          )
                        }
                      >

                        <Printer
                          size={13}
                        />

                        Imprimir

                      </button>

                    </div>
                  )}

                </article>

              ),
            )}

          </div>
        )}

      </article>

    </section>
  );
}


export default ReportsPage;