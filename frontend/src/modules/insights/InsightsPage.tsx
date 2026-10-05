
import { useState } from "react";

import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Database,
  Lightbulb,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { useApiResource } from "../../hooks/useApiResource";

import {
  generateInsights,
  getInsights,
} from "../../services/reporting.service";

import type { InsightItem } from "../../types/reporting";

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

function formatEvidence(evidence: Record<string, unknown> | null) {
  if (!evidence) {
    return "";
  }

  return JSON.stringify(evidence, null, 2);
}

function badgeClass(severity: string | null) {
  const value = severity?.trim().toLowerCase();

  if (
    value === "high" ||
    value === "critical" ||
    value === "alta" ||
    value === "crítica" ||
    value === "critica"
  ) {
    return "reporting-badge warning";
  }

  return "reporting-badge";
}

function InsightsPage() {
  const { data, loading, error, reload } =
    useApiResource<InsightItem[]>(getInsights);

  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [generationMessage, setGenerationMessage] = useState("");

  const insights = data ?? [];

  const activeCount = insights.filter(
    (item) => item.status.toLowerCase() === "active",
  ).length;

  const evidenceCount = insights.filter(
    (item) => item.evidence !== null,
  ).length;

  async function handleGenerateInsights() {
    setGenerating(true);
    setGenerationError("");
    setGenerationMessage("");

    try {
      const generated = await generateInsights();

      await reload();

      if (generated.length > 0) {
        setGenerationMessage(
          `Generación completada. El backend devolvió ${generated.length} insight(s).`,
        );
      } else {
        setGenerationMessage(
          "La generación finalizó, pero no se detectaron observaciones nuevas con las reglas analíticas actuales.",
        );
      }
    } catch (err) {
      setGenerationError(
        err instanceof Error
          ? err.message
          : "No se pudieron generar los insights.",
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section className="module-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">INTELIGENCIA EMPRESARIAL</span>

          <h1>Insights</h1>

          <p>
            Consulta observaciones empresariales persistidas y respaldadas por
            evidencia obtenida del backend de SalesIA Enterprise.
          </p>
        </div>

        <div className="module-main-icon">
          <Lightbulb size={27} />
        </div>
      </div>

      <div className="reporting-summary">
        <div className="reporting-summary-card">
          <span>Insights recibidos</span>
          <strong>{insights.length}</strong>
        </div>

        <div className="reporting-summary-card">
          <span>Estado active</span>
          <strong>{activeCount}</strong>
        </div>

        <div className="reporting-summary-card">
          <span>Con evidencia</span>
          <strong>{evidenceCount}</strong>
        </div>
      </div>

      <article className="panel">
        <div className="reporting-toolbar">
          <div className="reporting-toolbar-info">
            <BarChart3 size={20} />

            <div>
              <h2>Observaciones analíticas</h2>
              <p>
                Consulta los registros guardados y genera nuevos insights
                empresariales.
              </p>
            </div>
          </div>

          <div className="reporting-toolbar-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={loading || generating}
              onClick={() => {
                void reload();
              }}
            >
              <RefreshCw size={15} />
              Actualizar
            </button>

            <button
              type="button"
              className="primary-button"
              disabled={generating || loading}
              onClick={() => {
                void handleGenerateInsights();
              }}
            >
              <Sparkles size={15} />
              {generating ? "Generando..." : "Generar insights"}
            </button>
          </div>
        </div>

        {generationMessage && (
          <div className="reporting-success" role="status">
            <CheckCircle2 size={16} />
            <span>{generationMessage}</span>
          </div>
        )}

        {generationError && (
          <div className="reporting-error" role="alert">
            <AlertTriangle size={16} />
            <span>{generationError}</span>
          </div>
        )}

        {loading ? (
          <div className="reporting-loading">
            Cargando insights...
          </div>
        ) : error ? (
          <div className="reporting-error" role="alert">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        ) : insights.length === 0 ? (
          <div className="reporting-empty">
            <div>
              <Database size={28} />

              <strong>No existen insights registrados</strong>

              <p>
                Puedes generar insights para analizar las variaciones de
                ingresos y del ticket promedio de tu empresa.
              </p>
            </div>
          </div>
        ) : (
          <div className="reporting-grid">
            {insights.map((insight) => (
              <article key={insight.id} className="reporting-card">
                <div className="reporting-card-header">
                  <div className="reporting-card-title">
                    <div className="reporting-card-icon">
                      <Lightbulb size={17} />
                    </div>

                    <div>
                      <h3>{insight.title}</h3>

                      {insight.insight_type && (
                        <div style={{ marginTop: 6 }}>
                          <span className="reporting-badge neutral">
                            {insight.insight_type}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {insight.severity && (
                    <span className={badgeClass(insight.severity)}>
                      {insight.severity}
                    </span>
                  )}
                </div>

                <p className="reporting-card-description">
                  {insight.description}
                </p>

                {insight.evidence && (
                  <pre className="reporting-evidence">
                    {formatEvidence(insight.evidence)}
                  </pre>
                )}

                <div className="reporting-meta">
                  <span className="reporting-meta-item">
                    <CheckCircle2 size={12} />
                    {insight.status}
                  </span>

                  <span className="reporting-meta-item">
                    <Clock3 size={12} />
                    {formatDate(insight.created_at)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}

export default InsightsPage;
