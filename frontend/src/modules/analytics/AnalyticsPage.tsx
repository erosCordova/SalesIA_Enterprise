import {
  useState,
} from "react";

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
} from "../../services/analytics.service";

import type {
  CompareStatisticsResponse,
} from "../../types/analytics";

import "./analytics.css";


function parseNumbers(
  raw: string,
) {
  const parts =
    raw
      .split(/[\s,;]+/)
      .map(
        (value) =>
          value.trim(),
      )
      .filter(Boolean);

  if (parts.length === 0) {
    throw new Error(
      "Ingresa al menos un valor numérico.",
    );
  }

  const values =
    parts.map(Number);

  if (
    values.some(
      (value) =>
        !Number.isFinite(value),
    )
  ) {
    throw new Error(
      "Todos los valores deben ser numéricos.",
    );
  }

  return values;
}


function formatNumber(
  value: number,
) {
  return new Intl.NumberFormat(
    "es-PE",
    {
      maximumFractionDigits: 4,
    },
  ).format(value);
}


function AnalyticsPage() {
  const [
    valuesText,
    setValuesText,
  ] = useState(
    "120, 145, 160, 175, 220",
  );

  const [
    result,
    setResult,
  ] =
    useState<CompareStatisticsResponse | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  async function analyze() {
    setError("");
    setResult(null);

    let values: number[];

    try {
      values =
        parseNumbers(
          valuesText,
        );
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
      const response =
        await compareStatistics(
          values,
        );

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
    setValuesText(
      "95, 110, 120, 125, 130, 145, 180, 260",
    );

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
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">
            INTELIGENCIA COMERCIAL
          </span>

          <h1>
            Analytics
          </h1>

          <p>
            Ejecuta análisis estadístico
            real mediante el backend de
            SalesIA Enterprise y compara
            media y mediana sobre una
            serie numérica.
          </p>
        </div>

        <div className="module-main-icon">
          <BarChart3
            size={27}
          />
        </div>
      </div>


      <div className="analytics-workspace">
        <article className="panel analytics-form-panel">
          <div className="analytics-section-title">
            <Database
              size={20}
            />

            <div>
              <h2>
                Datos de análisis
              </h2>

              <p>
                Introduce una serie de
                valores separados por
                comas, espacios o punto
                y coma.
              </p>
            </div>
          </div>


          <label className="analytics-field">
            <span>
              Valores numéricos
            </span>

            <textarea
              value={
                valuesText
              }
              onChange={(
                event,
              ) =>
                setValuesText(
                  event.target
                    .value,
                )
              }
              placeholder="Ejemplo: 100, 120, 135, 150"
            />

            <div className="analytics-help">
              Puedes analizar ventas,
              importes, cantidades,
              tickets u otras
              observaciones numéricas.
            </div>
          </label>


          {error && (
            <div className="analytics-error">
              <Sigma
                size={15}
              />

              <span>
                {error}
              </span>
            </div>
          )}


          <div className="analytics-actions">
            <button
              type="button"
              className="primary-button"
              disabled={loading}
              onClick={() => {
                void analyze();
              }}
            >
              <Calculator
                size={16}
              />

              {loading
                ? "Analizando..."
                : "Analizar datos"}
            </button>


            <button
              type="button"
              className="secondary-button"
              disabled={loading}
              onClick={
                loadExample
              }
            >
              <TrendingUp
                size={16}
              />

              Cargar ejemplo
            </button>


            <button
              type="button"
              className="secondary-button"
              disabled={loading}
              onClick={clear}
            >
              <RefreshCw
                size={16}
              />

              Limpiar
            </button>
          </div>
        </article>


        <article className="panel analytics-result-panel">
          <div className="analytics-section-title">
            <Sigma
              size={20}
            />

            <div>
              <h2>
                Resultado estadístico
              </h2>

              <p>
                Resultado devuelto por
                el backend.
              </p>
            </div>
          </div>


          {!result ? (
            <div className="analytics-result-empty">
              <div>
                <BarChart3
                  size={28}
                />

                <strong>
                  Sin análisis ejecutado
                </strong>

                <p>
                  Introduce los valores
                  y pulsa Analizar datos.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="analytics-success">
                <CheckCircle2
                  size={15}
                />

                Análisis completado
                correctamente.
              </div>


              <div className="analytics-result-grid">
                <div className="analytics-metric">
                  <span>
                    Observaciones
                  </span>

                  <strong>
                    {result.count}
                  </strong>
                </div>


                <div className="analytics-metric">
                  <span>
                    Media
                  </span>

                  <strong>
                    {formatNumber(
                      result.mean,
                    )}
                  </strong>
                </div>


                <div className="analytics-metric">
                  <span>
                    Mediana
                  </span>

                  <strong>
                    {formatNumber(
                      result.median,
                    )}
                  </strong>
                </div>


                <div className="analytics-metric">
                  <span>
                    Diferencia
                  </span>

                  <strong>
                    {formatNumber(
                      result.difference,
                    )}
                  </strong>
                </div>
              </div>


              <div className="analytics-interpretation">
                <span>
                  Interpretación
                </span>

                <p>
                  {result.interpretation}
                </p>
              </div>
            </>
          )}
        </article>
      </div>
    </section>
  );
}


export default AnalyticsPage;
