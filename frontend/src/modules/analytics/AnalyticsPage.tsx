import { useEffect, useState } from "react";

import {
  BarChart3,
  Calculator,
  CheckCircle2,
  Database,
  RefreshCw,
  Sigma,
  TrendingUp,
} from "lucide-react";

import {
  compareStatistics,
  getAnalyticsDashboard,
  analyzeSalesStatistics,
} from "../../services/analytics.service";

import type {
  AnalyticsDashboardResponse,
  CompareStatisticsResponse,
  SalesStatisticsResponse,
} from "../../types/analytics";

import "./analytics.css";

function parseNumbers(raw: string) {
  const parts = raw
    .split(/[\s,;]+/)
    .map((value) => value.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    throw new Error("Ingresa al menos un valor numérico.");
  }

  const values = parts.map(Number);

  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error("Todos los valores deben ser numéricos.");
  }

  return values;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-PE", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function AnalyticsPage() {
  // Análisis estadístico
  const [valuesText, setValuesText] = useState("120, 145, 160, 175, 220");

  const [result, setResult] = useState<CompareStatisticsResponse | null>(null);
  const [salesAnalysis, setSalesAnalysis] =
    useState<SalesStatisticsResponse | null>(null);

  const [salesAnalysisLoading, setSalesAnalysisLoading] = useState(false);

  const [salesAnalysisError, setSalesAnalysisError] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Dashboard comercial
  const today = new Date().toLocaleDateString("en-CA");

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const [dashboard, setDashboard] = useState<AnalyticsDashboardResponse | null>(
    null,
  );

  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");

  async function handleSalesAnalysis() {
    setSalesAnalysisLoading(true);
    setSalesAnalysisError("");
    setSalesAnalysis(null);

    try {
      if (startDate && endDate && startDate > endDate) {
        throw new Error(
          "La fecha inicial no puede ser posterior a la fecha final.",
        );
      }

      const result = await analyzeSalesStatistics(
        startDate || undefined,
        endDate || undefined,
      );

      setSalesAnalysis(result);
    } catch (error) {
      setSalesAnalysisError(
        error instanceof Error
          ? error.message
          : "No se pudo analizar las ventas.",
      );
    } finally {
      setSalesAnalysisLoading(false);
    }
  }

  async function loadDashboard() {
    setDashboardError("");

    if (startDate && endDate && startDate > endDate) {
      setDashboardError(
        "La fecha inicial no puede ser posterior a la fecha final.",
      );
      return;
    }

    setDashboardLoading(true);

    try {
      const response = await getAnalyticsDashboard(
        startDate || undefined,
        endDate || undefined,
      );

      setDashboard(response);
    } catch (err) {
      setDashboardError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el dashboard de ventas.",
      );
    } finally {
      setDashboardLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function analyze() {
    setError("");
    setResult(null);

    let values: number[];

    try {
      values = parseNumbers(valuesText);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Los valores ingresados no son válidos.",
      );
      return;
    }

    setLoading(true);

    try {
      const response = await compareStatistics(values);
      setResult(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo ejecutar el análisis estadístico.",
      );
    } finally {
      setLoading(false);
    }
  }

  function loadExample() {
    setValuesText("95, 110, 120, 125, 130, 145, 180, 260");
    setResult(null);
    setError("");
  }

  function clear() {
    setValuesText("");
    setResult(null);
    setError("");
  }

  return (
    <section className="module-page">
      {/* Encabezado */}
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">INTELIGENCIA COMERCIAL</span>

          <h1>Analytics</h1>

          <p>
            Consulta indicadores de ventas y ejecuta análisis estadísticos desde
            SalesIA Enterprise.
          </p>
        </div>

        <div className="module-main-icon">
          <BarChart3 size={27} />
        </div>
      </div>

      {/* Dashboard comercial */}
      <section className="panel sales-dashboard">
        <div className="analytics-section-title">
          <TrendingUp size={20} />

          <div>
            <h2>Dashboard de ventas</h2>
            <p>Indicadores comerciales obtenidos desde el backend.</p>
          </div>
        </div>

        <div className="sales-dashboard-filters">
          <label>
            <span>Fecha inicial</span>

            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>

          <label>
            <span>Fecha final</span>

            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>

          <button
            type="button"
            className="primary-button"
            disabled={dashboardLoading}
            onClick={() => void loadDashboard()}
          >
            <RefreshCw size={16} />

            {dashboardLoading ? "Consultando..." : "Consultar ventas"}
          </button>
        </div>

        {dashboardError && (
          <div className="analytics-error" role="alert">
            {dashboardError}
          </div>
        )}
        <section className="analytics-section">
          <h2>Análisis estadístico de ventas</h2>

         

          <button
            type="button"
            onClick={handleSalesAnalysis}
            disabled={salesAnalysisLoading}
          >
            {salesAnalysisLoading
              ? "Analizando ventas..."
              : "Analizar ventas del período"}
          </button>

          {salesAnalysisError && (
            <p role="alert" className="error-message">
              {salesAnalysisError}
            </p>
          )}

          {salesAnalysis && (
            <div className="analytics-results">
              <p>
                <strong>Ventas analizadas:</strong> {salesAnalysis.count}
              </p>

              <p>
                <strong>Importe medio:</strong>{" "}
                {formatCurrency(salesAnalysis.mean)}
              </p>

              <p>
                <strong>Mediana:</strong> {formatCurrency(salesAnalysis.median)}
              </p>

              <p>
                <strong>Diferencia absoluta:</strong>{" "}
                {formatCurrency(salesAnalysis.difference)}
              </p>

              <p>
                <strong>Interpretación:</strong> {salesAnalysis.interpretation}
              </p>
            </div>
          )}
        </section>

        {dashboardLoading && <p>Consultando información de ventas...</p>}

        {dashboard && !dashboardLoading && (
          <>
            <div className="analytics-result-grid">
              <div className="analytics-metric">
                <span>Ventas completadas</span>
                <strong>{dashboard.summary.total_sales}</strong>
              </div>

              <div className="analytics-metric">
                <span>Ingresos totales</span>
                <strong>
                  {formatCurrency(dashboard.summary.total_revenue)}
                </strong>
              </div>

              <div className="analytics-metric">
                <span>Ticket promedio</span>
                <strong>
                  {formatCurrency(dashboard.summary.average_ticket)}
                </strong>
              </div>

              <div className="analytics-metric">
                <span>Ticket mediano</span>
                <strong>
                  {formatCurrency(dashboard.summary.median_ticket)}
                </strong>
              </div>
            </div>

            <h3>Ventas por día</h3>

            {dashboard.daily_sales.length === 0 ? (
              <p>No hay ventas completadas en el período seleccionado.</p>
            ) : (
              <div className="sales-dashboard-table-wrapper">
                <table className="sales-dashboard-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Ventas</th>
                      <th>Ingresos</th>
                    </tr>
                  </thead>

                  <tbody>
                    {dashboard.daily_sales.map((item) => (
                      <tr key={item.date}>
                        <td>{item.date}</td>
                        <td>{item.sales_count}</td>
                        <td>{formatCurrency(item.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {!dashboard && !dashboardLoading && !dashboardError && (
          <p>
            Selecciona un período y pulsa «Consultar ventas» para cargar los
            indicadores.
          </p>
        )}
      </section>

      {/* Área de análisis estadístico */}
      <div className="analytics-workspace">
        <article className="panel analytics-form-panel">
          <div className="analytics-section-title">
            <Database size={20} />

            <div>
              <h2>Datos de análisis</h2>

              <p>
                Introduce valores separados por comas, espacios o punto y coma.
              </p>
            </div>
          </div>

          <label className="analytics-field">
            <span>Valores numéricos</span>

            <textarea
              value={valuesText}
              onChange={(event) => setValuesText(event.target.value)}
              placeholder="Ejemplo: 100, 120, 135, 150"
            />

            <div className="analytics-help">
              Puedes analizar ventas, importes, cantidades, tickets u otras
              observaciones numéricas.
            </div>
          </label>

          {error && (
            <div className="analytics-error" role="alert">
              <Sigma size={15} />
              <span>{error}</span>
            </div>
          )}

          <div className="analytics-actions">
            <button
              type="button"
              className="primary-button"
              disabled={loading}
              onClick={() => void analyze()}
            >
              <Calculator size={16} />
              {loading ? "Analizando..." : "Analizar datos"}
            </button>

            <button
              type="button"
              className="secondary-button"
              disabled={loading}
              onClick={loadExample}
            >
              <TrendingUp size={16} />
              Cargar ejemplo
            </button>

            <button
              type="button"
              className="secondary-button"
              disabled={loading}
              onClick={clear}
            >
              <RefreshCw size={16} />
              Limpiar
            </button>
          </div>
        </article>

        <article className="panel analytics-result-panel">
          <div className="analytics-section-title">
            <Sigma size={20} />

            <div>
              <h2>Resultado estadístico</h2>
              <p>Resultado devuelto por el backend.</p>
            </div>
          </div>

          {!result ? (
            <div className="analytics-result-empty">
              <div>
                <BarChart3 size={28} />

                <strong>Sin análisis ejecutado</strong>

                <p>Introduce los valores y pulsa Analizar datos.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="analytics-success">
                <CheckCircle2 size={15} />
                Análisis completado correctamente.
              </div>

              <div className="analytics-result-grid">
                <div className="analytics-metric">
                  <span>Observaciones</span>
                  <strong>{result.count}</strong>
                </div>

                <div className="analytics-metric">
                  <span>Media</span>
                  <strong>{formatNumber(result.mean)}</strong>
                </div>

                <div className="analytics-metric">
                  <span>Mediana</span>
                  <strong>{formatNumber(result.median)}</strong>
                </div>

                <div className="analytics-metric">
                  <span>Diferencia</span>
                  <strong>{formatNumber(result.difference)}</strong>
                </div>
              </div>

              <div className="analytics-interpretation">
                <span>Interpretación</span>
                <p>{result.interpretation}</p>
              </div>
            </>
          )}
        </article>
      </div>
    </section>
  );
}

export default AnalyticsPage;
