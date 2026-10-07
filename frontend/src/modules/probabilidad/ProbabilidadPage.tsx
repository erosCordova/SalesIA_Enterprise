import {
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  ArrowRight,
  BrainCircuit,
  Calculator,
  CheckCircle2,
  Info,
  Percent,
  RotateCcw,
} from "lucide-react";

import ExportActions from "../../components/ui/ExportActions";

import {
  calculateBayes,
} from "../../services/analytics.service";

import {
  createVisualPdfFile,
  downloadVisualPdf,
  exportDateStamp,
  exportRowsToCsv,
  exportRowsToExcel,
  shareFile,
  type ExportRow,
} from "../../utils/exporting";

import type {
  BayesResponse,
} from "../../types/analytics";

import "./probabilidad-commercial.css";


function formatPercent(
  value: number,
) {
  return new Intl.NumberFormat(
    "es-PE",
    {
      style: "percent",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  ).format(value);
}


function parsePercent(
  raw: string,
  label: string,
  allowZero = true,
) {
  const value =
    raw
      .trim()
      .replace(
        ",",
        ".",
      );

  if (!value) {
    throw new Error(
      `Ingresa ${label}.`,
    );
  }

  const parsed =
    Number(value);

  if (
    !Number.isFinite(parsed)
    || parsed < 0
    || parsed > 100
    || (
      !allowZero
      && parsed === 0
    )
  ) {
    throw new Error(
      allowZero
        ? `${label} debe estar entre 0% y 100%.`
        : `${label} debe ser mayor que 0% y como máximo 100%.`,
    );
  }

  return parsed / 100;
}


export default function ProbabilidadPage() {
  const exportRef =
    useRef<HTMLElement>(
      null,
    );


  const [
    exportError,
    setExportError,
  ] =
    useState("");


  const [
    eventA,
    setEventA,
  ] =
    useState("");

  const [
    eventB,
    setEventB,
  ] =
    useState("");

  const [
    probabilityA,
    setProbabilityA,
  ] =
    useState("");

  const [
    probabilityBGivenA,
    setProbabilityBGivenA,
  ] =
    useState("");

  const [
    probabilityB,
    setProbabilityB,
  ] =
    useState("");

  const [
    result,
    setResult,
  ] =
    useState<
      BayesResponse | null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");


  async function handleSubmit(
    event: FormEvent,
  ) {
    event.preventDefault();

    setError("");
    setExportError("");
    setResult(null);

    const cleanEventA =
      eventA.trim();

    const cleanEventB =
      eventB.trim();

    if (
      !cleanEventA
      || !cleanEventB
    ) {
      setError(
        "Define el evento A y la evidencia B.",
      );

      return;
    }

    let parsedA: number;
    let parsedBGivenA: number;
    let parsedB: number;

    try {
      parsedA =
        parsePercent(
          probabilityA,
          "P(A)",
        );

      parsedBGivenA =
        parsePercent(
          probabilityBGivenA,
          "P(B|A)",
        );

      parsedB =
        parsePercent(
          probabilityB,
          "P(B)",
          false,
        );
    } catch (
      validationError
    ) {
      setError(
        validationError
          instanceof Error
          ? validationError.message
          : "Las probabilidades ingresadas no son válidas.",
      );

      return;
    }

    setLoading(true);

    try {
      const response =
        await calculateBayes({
          event_a:
            cleanEventA,

          event_b:
            cleanEventB,

          probability_a:
            parsedA,

          probability_b_given_a:
            parsedBGivenA,

          probability_b:
            parsedB,
        });

      setResult(
        response,
      );
    } catch (
      requestError
    ) {
      setError(
        requestError
          instanceof Error
          ? requestError.message
          : "No se pudo ejecutar el cálculo de Bayes.",
      );
    } finally {
      setLoading(false);
    }
  }


  function exportRows(): ExportRow[] {
    if (!result) {
      return [];
    }


    return [
      {
        "Evento A":
          result.event_a,

        "Evidencia B":
          result.event_b,

        "P(A) %":
          result.probability_a
          * 100,

        "P(B|A) %":
          result.probability_b_given_a
          * 100,

        "P(B) %":
          result.probability_b
          * 100,

        "P(A|B) %":
          result.posterior_probability
          * 100,

        Interpretación:
          result.interpretation,
      },
    ];
  }


  function exportFilename() {
    return `probabilidad-${exportDateStamp()}`;
  }


  async function handlePdf() {
    if (
      !exportRef.current
      || !result
    ) {
      return;
    }


    setExportError("");


    try {
      await downloadVisualPdf(
        exportRef.current,
        exportFilename(),
      );
    } catch (
      currentError
    ) {
      setExportError(
        currentError instanceof Error
          ? currentError.message
          : "No se pudo generar el PDF.",
      );
    }
  }


  function handleCsv() {
    if (!result) {
      return;
    }


    setExportError("");


    try {
      exportRowsToCsv(
        exportFilename(),
        exportRows(),
      );
    } catch (
      currentError
    ) {
      setExportError(
        currentError instanceof Error
          ? currentError.message
          : "No se pudo generar el CSV.",
      );
    }
  }


  async function handleExcel() {
    if (!result) {
      return;
    }


    setExportError("");


    try {
      await exportRowsToExcel(
        exportFilename(),
        "Probabilidad",
        exportRows(),
      );
    } catch (
      currentError
    ) {
      setExportError(
        currentError instanceof Error
          ? currentError.message
          : "No se pudo generar el archivo Excel.",
      );
    }
  }


  async function handleShare() {
    if (
      !exportRef.current
      || !result
    ) {
      return;
    }


    setExportError("");


    try {
      const file =
        await createVisualPdfFile(
          exportRef.current,
          exportFilename(),
        );


      await shareFile(
        file,
        "Probabilidad - SalesIA Enterprise",
        `Resultado probabilístico: ${result.event_a}.`,
      );
    } catch (
      currentError
    ) {
      setExportError(
        currentError instanceof Error
          ? currentError.message
          : "No se pudo compartir el resultado.",
      );
    }
  }


  function reset() {
    setEventA("");
    setEventB("");
    setProbabilityA("");
    setProbabilityBGivenA("");
    setProbabilityB("");
    setResult(null);
    setError("");
    setExportError("");
  }


  const posteriorPercent =
    result
      ? Math.min(
          100,
          Math.max(
            0,
            result
              .posterior_probability
              * 100,
          ),
        )
      : 0;


  return (
    <section className="probability-page">
      <header className="probability-header">
        <div>
          <div className="probability-eyebrow">
            <BrainCircuit
              size={14}
            />

            Análisis probabilístico
          </div>

          <h1>
            Probabilidad
          </h1>

          <p>
            Evalúa escenarios mediante
            el Teorema de Bayes y obtén
            una probabilidad posterior.
          </p>
        </div>

        {result && (
          <div
            className="probability-header-actions"
            data-export-hide="true"
          >
            <ExportActions
              disabled={loading}
              onPdf={handlePdf}
              onCsv={handleCsv}
              onExcel={handleExcel}
              onShare={handleShare}
            />
          </div>
        )}
      </header>


      {exportError && (
        <div
          className="probability-export-error"
          data-export-hide="true"
        >
          {exportError}
        </div>
      )}


      <div className="probability-workspace">
        <form
          className="probability-form-panel"
          onSubmit={
            handleSubmit
          }
        >
          <header className="probability-panel-heading">
            <div>
              <span>
                ESCENARIO
              </span>

              <h2>
                Datos del análisis
              </h2>

              <p>
                Define los eventos y sus
                probabilidades conocidas.
              </p>
            </div>

            <BrainCircuit
              size={19}
            />
          </header>


          <div className="probability-events">
            <label className="probability-field">
              <span>
                Evento A
              </span>

              <input
                type="text"
                maxLength={200}
                value={eventA}
                onChange={(
                  event,
                ) =>
                  setEventA(
                    event
                      .target
                      .value,
                  )
                }
                placeholder="Ej. Cliente realiza una compra"
              />

              <small>
                Evento cuya probabilidad
                deseas estimar.
              </small>
            </label>


            <div className="probability-event-arrow">
              <ArrowRight
                size={18}
              />
            </div>


            <label className="probability-field">
              <span>
                Evidencia B
              </span>

              <input
                type="text"
                maxLength={200}
                value={eventB}
                onChange={(
                  event,
                ) =>
                  setEventB(
                    event
                      .target
                      .value,
                  )
                }
                placeholder="Ej. Cliente recibió una promoción"
              />

              <small>
                Evidencia que ya conocemos.
              </small>
            </label>
          </div>


          <div className="probability-divider" />


          <div className="probability-input-grid">
            <label className="probability-number-field">
              <div>
                <span>
                  P(A)
                </span>

                <small>
                  Probabilidad inicial
                </small>
              </div>

              <div className="probability-percent-input">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={
                    probabilityA
                  }
                  onChange={(
                    event,
                  ) =>
                    setProbabilityA(
                      event
                        .target
                        .value,
                    )
                  }
                  placeholder="0"
                />

                <span>
                  %
                </span>
              </div>
            </label>


            <label className="probability-number-field featured">
              <div>
                <span>
                  P(B|A)
                </span>

                <small>
                  Evidencia dado A
                </small>
              </div>

              <div className="probability-percent-input">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={
                    probabilityBGivenA
                  }
                  onChange={(
                    event,
                  ) =>
                    setProbabilityBGivenA(
                      event
                        .target
                        .value,
                    )
                  }
                  placeholder="0"
                />

                <span>
                  %
                </span>
              </div>
            </label>


            <label className="probability-number-field">
              <div>
                <span>
                  P(B)
                </span>

                <small>
                  Probabilidad de evidencia
                </small>
              </div>

              <div className="probability-percent-input">
                <input
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={
                    probabilityB
                  }
                  onChange={(
                    event,
                  ) =>
                    setProbabilityB(
                      event
                        .target
                        .value,
                    )
                  }
                  placeholder="0"
                />

                <span>
                  %
                </span>
              </div>
            </label>
          </div>


          <div className="probability-tip">
            <Info
              size={15}
            />

            <span>
              Ingresa las probabilidades
              como porcentajes entre
              0 y 100.
            </span>
          </div>


          {error && (
            <div
              className="probability-error"
              role="alert"
            >
              <Percent
                size={15}
              />

              <span>
                {error}
              </span>
            </div>
          )}


          <div className="probability-actions">
            <button
              type="button"
              className="probability-secondary-button"
              disabled={loading}
              onClick={reset}
            >
              <RotateCcw
                size={15}
              />

              Limpiar
            </button>

            <button
              type="submit"
              className="probability-primary-button"
              disabled={loading}
            >
              <Calculator
                size={15}
              />

              {loading
                ? "Calculando..."
                : "Calcular probabilidad"}
            </button>
          </div>
        </form>


        <section
          ref={exportRef}
          className="probability-result-panel"
        >
          <header className="probability-panel-heading">
            <div>
              <span>
                RESULTADO
              </span>

              <h2>
                Probabilidad posterior
              </h2>

              <p>
                Resultado del análisis
                bayesiano.
              </p>
            </div>

            <Percent
              size={19}
            />
          </header>


          {!result ? (
            <div className="probability-empty">
              <div className="probability-empty-icon">
                <Percent
                  size={27}
                />
              </div>

              <strong>
                Esperando análisis
              </strong>

              <p>
                Completa los datos del
                escenario para obtener
                P(A|B).
              </p>
            </div>
          ) : (
            <div className="probability-result-content">
              <div className="probability-result-success">
                <CheckCircle2
                  size={15}
                />

                Cálculo completado
              </div>


              <div className="probability-posterior">
                <span>
                  P(A|B)
                </span>

                <strong>
                  {formatPercent(
                    result
                      .posterior_probability,
                  )}
                </strong>

                <small>
                  Probabilidad posterior
                </small>
              </div>


              <div className="probability-gauge">
                <div className="probability-gauge-track">
                  <div
                    className="probability-gauge-value"
                    style={{
                      width:
                        `${posteriorPercent}%`,
                    }}
                  />
                </div>

                <div className="probability-gauge-scale">
                  <span>
                    0%
                  </span>

                  <span>
                    50%
                  </span>

                  <span>
                    100%
                  </span>
                </div>
              </div>


              <div className="probability-result-metrics">
                <div>
                  <span>
                    P(A)
                  </span>

                  <strong>
                    {formatPercent(
                      result
                        .probability_a,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    P(B|A)
                  </span>

                  <strong>
                    {formatPercent(
                      result
                        .probability_b_given_a,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    P(B)
                  </span>

                  <strong>
                    {formatPercent(
                      result
                        .probability_b,
                    )}
                  </strong>
                </div>
              </div>


              <div className="probability-result-scenario">
                <div>
                  <span>
                    Evento A
                  </span>

                  <strong>
                    {
                      result.event_a
                    }
                  </strong>
                </div>

                <ArrowRight
                  size={15}
                />

                <div>
                  <span>
                    Evidencia B
                  </span>

                  <strong>
                    {
                      result.event_b
                    }
                  </strong>
                </div>
              </div>


              <div className="probability-interpretation">
                <span>
                  Interpretación
                </span>

                <p>
                  {
                    result
                      .interpretation
                  }
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
