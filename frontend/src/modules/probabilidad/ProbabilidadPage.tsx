import {
  useState,
} from "react";

import {
  BrainCircuit,
  Calculator,
  CheckCircle2,
  Database,
  Percent,
  Sigma,
} from "lucide-react";

import {
  analyzeRandomVariable,
  calculateBayes,
} from "../../services/analytics.service";

import type {
  BayesResponse,
  RandomVariableResponse,
} from "../../types/analytics";

import "../analytics/analytics.css";


function parseList(
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
      "Ingresa al menos un valor.",
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
      maximumFractionDigits: 6,
    },
  ).format(value);
}


function formatPercent(
  value: number,
) {
  return new Intl.NumberFormat(
    "es-PE",
    {
      style: "percent",
      maximumFractionDigits: 2,
    },
  ).format(value);
}


function ProbabilidadPage() {
  const [
    eventA,
    setEventA,
  ] = useState(
    "Cliente realiza una compra",
  );

  const [
    eventB,
    setEventB,
  ] = useState(
    "Cliente recibió una promoción",
  );

  const [
    probabilityA,
    setProbabilityA,
  ] = useState(0.4);

  const [
    probabilityBGivenA,
    setProbabilityBGivenA,
  ] = useState(0.7);

  const [
    probabilityB,
    setProbabilityB,
  ] = useState(0.5);

  const [
    bayesResult,
    setBayesResult,
  ] =
    useState<BayesResponse | null>(
      null,
    );

  const [
    bayesLoading,
    setBayesLoading,
  ] = useState(false);

  const [
    bayesError,
    setBayesError,
  ] = useState("");


  const [
    variableName,
    setVariableName,
  ] = useState(
    "Cantidad de productos por compra",
  );

  const [
    valuesText,
    setValuesText,
  ] = useState(
    "1, 2, 3, 4",
  );

  const [
    probabilitiesText,
    setProbabilitiesText,
  ] = useState(
    "0.15, 0.35, 0.30, 0.20",
  );

  const [
    variableResult,
    setVariableResult,
  ] =
    useState<RandomVariableResponse | null>(
      null,
    );

  const [
    variableLoading,
    setVariableLoading,
  ] = useState(false);

  const [
    variableError,
    setVariableError,
  ] = useState("");


  async function runBayes() {
    setBayesError("");
    setBayesResult(null);


    if (
      !eventA.trim() ||
      !eventB.trim()
    ) {
      setBayesError(
        "Los eventos A y B son obligatorios.",
      );

      return;
    }


    if (
      probabilityA < 0 ||
      probabilityA > 1 ||
      probabilityBGivenA < 0 ||
      probabilityBGivenA > 1 ||
      probabilityB <= 0 ||
      probabilityB > 1
    ) {
      setBayesError(
        "Las probabilidades deben estar entre 0 y 1, y P(B) debe ser mayor que 0.",
      );

      return;
    }


    setBayesLoading(true);


    try {
      const response =
        await calculateBayes({
          event_a:
            eventA.trim(),

          event_b:
            eventB.trim(),

          probability_a:
            probabilityA,

          probability_b_given_a:
            probabilityBGivenA,

          probability_b:
            probabilityB,
        });


      setBayesResult(
        response,
      );
    } catch (err) {
      setBayesError(
        err instanceof Error
          ? err.message
          : "No se pudo calcular el Teorema de Bayes.",
      );
    } finally {
      setBayesLoading(false);
    }
  }


  async function runVariableAnalysis() {
    setVariableError("");
    setVariableResult(null);


    if (
      !variableName.trim()
    ) {
      setVariableError(
        "El nombre de la variable es obligatorio.",
      );

      return;
    }


    let values: number[];
    let probabilities: number[];


    try {
      values =
        parseList(
          valuesText,
        );

      probabilities =
        parseList(
          probabilitiesText,
        );
    } catch (err) {
      setVariableError(
        err instanceof Error
          ? err.message
          : "La distribución ingresada no es válida.",
      );

      return;
    }


    if (
      values.length !==
      probabilities.length
    ) {
      setVariableError(
        "Debe existir una probabilidad para cada valor de la variable.",
      );

      return;
    }


    if (
      probabilities.some(
        (probability) =>
          probability < 0 ||
          probability > 1,
      )
    ) {
      setVariableError(
        "Todas las probabilidades deben estar entre 0 y 1.",
      );

      return;
    }


    const probabilityTotal =
      probabilities.reduce(
        (total, value) =>
          total + value,
        0,
      );


    if (
      Math.abs(
        probabilityTotal - 1,
      ) > 0.000001
    ) {
      setVariableError(
        `La suma de probabilidades debe ser 1. Actualmente es ${formatNumber(
          probabilityTotal,
        )}.`,
      );

      return;
    }


    setVariableLoading(true);


    try {
      const response =
        await analyzeRandomVariable({
          name:
            variableName.trim(),

          values,

          probabilities,
        });


      setVariableResult(
        response,
      );
    } catch (err) {
      setVariableError(
        err instanceof Error
          ? err.message
          : "No se pudo analizar la variable aleatoria.",
      );
    } finally {
      setVariableLoading(false);
    }
  }


  return (
    <section className="module-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">
            ANÁLISIS ESTADÍSTICO
          </span>

          <h1>
            Probabilidad
          </h1>

          <p>
            Ejecuta cálculos reales del
            Teorema de Bayes y analiza
            distribuciones de variables
            aleatorias mediante el
            backend de SalesIA Enterprise.
          </p>
        </div>

        <div className="module-main-icon">
          <Percent
            size={27}
          />
        </div>
      </div>


      <div className="analytics-workspace">
        <article className="panel analytics-form-panel">
          <div className="analytics-section-title">
            <BrainCircuit
              size={20}
            />

            <div>
              <h2>
                Teorema de Bayes
              </h2>

              <p>
                Calcula P(A|B) a partir
                de P(A), P(B|A) y P(B).
              </p>
            </div>
          </div>


          <div className="analytics-form-grid">
            <label className="analytics-field">
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
                    event.target
                      .value,
                  )
                }
              />
            </label>


            <label className="analytics-field">
              <span>
                Evento B
              </span>

              <input
                type="text"
                maxLength={200}
                value={eventB}
                onChange={(
                  event,
                ) =>
                  setEventB(
                    event.target
                      .value,
                  )
                }
              />
            </label>
          </div>


          <div
            className="analytics-probability-grid"
            style={{
              marginTop: 14,
            }}
          >
            <label className="analytics-field">
              <span>
                P(A)
              </span>

              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={
                  probabilityA
                }
                onChange={(
                  event,
                ) =>
                  setProbabilityA(
                    Number(
                      event.target
                        .value,
                    ),
                  )
                }
              />
            </label>


            <label className="analytics-field">
              <span>
                P(B|A)
              </span>

              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={
                  probabilityBGivenA
                }
                onChange={(
                  event,
                ) =>
                  setProbabilityBGivenA(
                    Number(
                      event.target
                        .value,
                    ),
                  )
                }
              />
            </label>


            <label className="analytics-field">
              <span>
                P(B)
              </span>

              <input
                type="number"
                min="0.000001"
                max="1"
                step="0.01"
                value={
                  probabilityB
                }
                onChange={(
                  event,
                ) =>
                  setProbabilityB(
                    Number(
                      event.target
                        .value,
                    ),
                  )
                }
              />
            </label>
          </div>


          <div className="analytics-formula">
            P(A|B) = P(B|A) × P(A) / P(B)
          </div>


          {bayesError && (
            <div className="analytics-error">
              <Percent
                size={15}
              />

              <span>
                {bayesError}
              </span>
            </div>
          )}


          <div className="analytics-actions">
            <button
              type="button"
              className="primary-button"
              disabled={
                bayesLoading
              }
              onClick={() => {
                void runBayes();
              }}
            >
              <Calculator
                size={16}
              />

              {bayesLoading
                ? "Calculando..."
                : "Calcular Bayes"}
            </button>
          </div>
        </article>


        <article className="panel analytics-result-panel">
          <div className="analytics-section-title">
            <Percent
              size={20}
            />

            <div>
              <h2>
                Resultado de Bayes
              </h2>

              <p>
                Probabilidad posterior
                calculada por el backend.
              </p>
            </div>
          </div>


          {!bayesResult ? (
            <div className="analytics-result-empty">
              <div>
                <BrainCircuit
                  size={28}
                />

                <strong>
                  Sin cálculo ejecutado
                </strong>

                <p>
                  Define los eventos y
                  probabilidades para
                  obtener P(A|B).
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="analytics-success">
                <CheckCircle2
                  size={15}
                />

                Cálculo completado.
              </div>


              <div className="analytics-result-grid">
                <div className="analytics-metric">
                  <span>
                    P(A)
                  </span>

                  <strong>
                    {formatPercent(
                      bayesResult
                        .probability_a,
                    )}
                  </strong>
                </div>


                <div className="analytics-metric">
                  <span>
                    P(B|A)
                  </span>

                  <strong>
                    {formatPercent(
                      bayesResult
                        .probability_b_given_a,
                    )}
                  </strong>
                </div>


                <div className="analytics-metric">
                  <span>
                    P(B)
                  </span>

                  <strong>
                    {formatPercent(
                      bayesResult
                        .probability_b,
                    )}
                  </strong>
                </div>


                <div className="analytics-metric">
                  <span>
                    P(A|B)
                  </span>

                  <strong>
                    {formatPercent(
                      bayesResult
                        .posterior_probability,
                    )}
                  </strong>
                </div>
              </div>


              <div className="analytics-formula">
                {bayesResult.formula}
              </div>


              <div className="analytics-interpretation">
                <span>
                  Interpretación
                </span>

                <p>
                  {bayesResult.interpretation}
                </p>
              </div>
            </>
          )}
        </article>
      </div>


      <div
        className="analytics-workspace analytics-block-gap"
      >
        <article className="panel analytics-form-panel">
          <div className="analytics-section-title">
            <Sigma
              size={20}
            />

            <div>
              <h2>
                Variable aleatoria
              </h2>

              <p>
                Define una distribución
                discreta para calcular
                esperanza, varianza y
                desviación estándar.
              </p>
            </div>
          </div>


          <div className="analytics-form-grid">
            <label className="analytics-field full">
              <span>
                Nombre de la variable
              </span>

              <input
                type="text"
                maxLength={200}
                value={
                  variableName
                }
                onChange={(
                  event,
                ) =>
                  setVariableName(
                    event.target
                      .value,
                  )
                }
              />
            </label>


            <label className="analytics-field">
              <span>
                Valores
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
                placeholder="1, 2, 3, 4"
              />

              <div className="analytics-help">
                Un valor por cada
                resultado posible.
              </div>
            </label>


            <label className="analytics-field">
              <span>
                Probabilidades
              </span>

              <textarea
                value={
                  probabilitiesText
                }
                onChange={(
                  event,
                ) =>
                  setProbabilitiesText(
                    event.target
                      .value,
                  )
                }
                placeholder="0.15, 0.35, 0.30, 0.20"
              />

              <div className="analytics-help">
                Deben tener la misma
                cantidad de elementos y
                sumar exactamente 1.
              </div>
            </label>
          </div>


          {variableError && (
            <div className="analytics-error">
              <Sigma
                size={15}
              />

              <span>
                {variableError}
              </span>
            </div>
          )}


          <div className="analytics-actions">
            <button
              type="button"
              className="primary-button"
              disabled={
                variableLoading
              }
              onClick={() => {
                void runVariableAnalysis();
              }}
            >
              <Sigma
                size={16}
              />

              {variableLoading
                ? "Analizando..."
                : "Analizar variable"}
            </button>
          </div>
        </article>


        <article className="panel analytics-result-panel">
          <div className="analytics-section-title">
            <Database
              size={20}
            />

            <div>
              <h2>
                Distribución
              </h2>

              <p>
                Medidas obtenidas desde
                el análisis probabilístico.
              </p>
            </div>
          </div>


          {!variableResult ? (
            <div className="analytics-result-empty">
              <div>
                <Sigma
                  size={28}
                />

                <strong>
                  Sin distribución analizada
                </strong>

                <p>
                  Introduce valores y
                  probabilidades para
                  ejecutar el análisis.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="analytics-success">
                <CheckCircle2
                  size={15}
                />

                Distribución analizada.
              </div>


              <div className="analytics-result-grid">
                <div className="analytics-metric">
                  <span>
                    Observaciones
                  </span>

                  <strong>
                    {variableResult
                      .observations}
                  </strong>
                </div>


                <div className="analytics-metric">
                  <span>
                    Valor esperado
                  </span>

                  <strong>
                    {formatNumber(
                      variableResult
                        .expected_value,
                    )}
                  </strong>
                </div>


                <div className="analytics-metric">
                  <span>
                    Varianza
                  </span>

                  <strong>
                    {formatNumber(
                      variableResult
                        .variance,
                    )}
                  </strong>
                </div>


                <div className="analytics-metric">
                  <span>
                    Desviación estándar
                  </span>

                  <strong>
                    {formatNumber(
                      variableResult
                        .standard_deviation,
                    )}
                  </strong>
                </div>
              </div>


              <div className="analytics-interpretation">
                <span>
                  Variable
                </span>

                <p>
                  {variableResult.name}
                </p>
              </div>
            </>
          )}
        </article>
      </div>
    </section>
  );
}


export default ProbabilidadPage;
