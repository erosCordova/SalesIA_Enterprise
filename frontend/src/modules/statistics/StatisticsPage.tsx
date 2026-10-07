import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  BarChart3,
  Calculator,
  CheckCircle2,
  Info,
  RefreshCcw,
  Sigma,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  analyzeRandomVariable,
} from "../../services/analytics.service";

import type {
  RandomVariableResponse,
} from "../../types/analytics";

import "./variance-commercial.css";


interface ChartItem {
  index: string;
  value: number;
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


export default function StatisticsPage() {
  const [
    rawValues,
    setRawValues,
  ] =
    useState("");

  const [
    result,
    setResult,
  ] =
    useState<
      RandomVariableResponse | null
    >(null);

  const [
    analyzedValues,
    setAnalyzedValues,
  ] =
    useState<number[]>([]);

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


  const chartData =
    useMemo<ChartItem[]>(
      () =>
        analyzedValues.map(
          (
            value,
            index,
          ) => ({
            index:
              `${index + 1}`,
            value,
          }),
        ),
      [
        analyzedValues,
      ],
    );


  const minimum =
    analyzedValues.length > 0
      ? Math.min(
          ...analyzedValues,
        )
      : 0;

  const maximum =
    analyzedValues.length > 0
      ? Math.max(
          ...analyzedValues,
        )
      : 0;

  const dataRange =
    maximum - minimum;


  function parseValues() {
    const tokens =
      rawValues
        .trim()
        .split(
          /[\s,;]+/,
        )
        .filter(
          Boolean,
        );

    if (
      tokens.length < 2
    ) {
      throw new Error(
        "Ingresa por lo menos dos valores numéricos.",
      );
    }

    const values =
      tokens.map(
        Number,
      );

    if (
      values.some(
        (value) =>
          !Number.isFinite(
            value,
          ),
      )
    ) {
      throw new Error(
        "Todos los datos deben ser valores numéricos válidos.",
      );
    }

    return values;
  }


  function handleValuesChange(
    value: string,
  ) {
    setRawValues(
      value,
    );

    setResult(
      null,
    );

    setAnalyzedValues(
      [],
    );

    setError(
      "",
    );
  }


  async function handleAnalyze(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(
      "",
    );

    setResult(
      null,
    );

    try {
      const values =
        parseValues();

      setLoading(
        true,
      );

      const probability =
        1 /
        values.length;

      const probabilities =
        values.map(
          () =>
            probability,
        );

      const response =
        await analyzeRandomVariable(
          {
            name:
              "Varianza y desviación estándar",

            values,

            probabilities,
          },
        );

      setAnalyzedValues(
        values,
      );

      setResult(
        response,
      );
    } catch (
      currentError
    ) {
      setAnalyzedValues(
        [],
      );

      setError(
        currentError
          instanceof Error
          ? currentError.message
          : "No se pudo realizar el análisis estadístico.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }


  function handleClear() {
    setRawValues(
      "",
    );

    setResult(
      null,
    );

    setAnalyzedValues(
      [],
    );

    setError(
      "",
    );
  }


  return (
    <section className="variance-page">
      <header className="variance-header">
        <div>
          <div className="variance-eyebrow">
            <Sigma
              size={14}
            />

            Análisis estadístico
          </div>

          <h1>
            Varianza y Desviación Estándar
          </h1>

          <p>
            Analiza la dispersión de un conjunto
            de datos mediante el motor estadístico
            de SalesIA Enterprise.
          </p>
        </div>


      </header>


      <section className="variance-overview">
        <div className="variance-overview-icon">
          <Sigma
            size={22}
          />
        </div>

        <div className="variance-overview-content">
          <span>
            OBJETIVO
          </span>

          <strong>
            Medir la dispersión de los datos
          </strong>

          <p>
            Determina cuánto se alejan las
            observaciones respecto de su media.
          </p>
        </div>

      </section>


      <div className="variance-workspace">
        <form
          className="variance-panel variance-input-panel"
          onSubmit={
            handleAnalyze
          }
        >
          <header className="variance-panel-header">
            <div>
              <span>
                DATOS DE ENTRADA
              </span>

              <h2>
                Valores a analizar
              </h2>

              <p>
                Introduce las observaciones
                numéricas del conjunto.
              </p>
            </div>

            <Calculator
              size={19}
            />
          </header>


          <div className="variance-form-body">
            <label className="variance-field">
              <span>
                Conjunto de valores
              </span>

              <textarea
                value={
                  rawValues
                }
                onChange={(
                  event,
                ) =>
                  handleValuesChange(
                    event
                      .target
                      .value,
                  )
                }
                placeholder="Ej. 12, 15, 18, 20, 22, 25"
                disabled={
                  loading
                }
              />

              <small>
                Puedes separar los valores con
                comas, espacios, punto y coma
                o saltos de línea.
              </small>
            </label>


            <div className="variance-tip">
              <Info
                size={15}
              />

              <span>
                Cada observación recibe el mismo
                peso en el cálculo estadístico.
              </span>
            </div>


            {error && (
              <div
                className="variance-error"
                role="alert"
              >
                <Sigma
                  size={15}
                />

                <span>
                  {error}
                </span>
              </div>
            )}


            <div className="variance-actions">
              <button
                type="button"
                className="variance-secondary-button"
                onClick={
                  handleClear
                }
                disabled={
                  loading
                }
              >
                <RefreshCcw
                  size={15}
                />

                Limpiar
              </button>

              <button
                type="submit"
                className="variance-primary-button"
                disabled={
                  loading
                }
              >
                <Sigma
                  size={15}
                />

                {loading
                  ? "Calculando..."
                  : "Calcular dispersión"}
              </button>
            </div>
          </div>
        </form>


        <section className="variance-panel variance-concept-panel">
          <header className="variance-panel-header">
            <div>
              <span>
                REFERENCIA
              </span>

              <h2>
                Lectura de las medidas
              </h2>

              <p>
                Cómo interpretar los resultados.
              </p>
            </div>

            <BarChart3
              size={19}
            />
          </header>


          <div className="variance-concept-body">
            <div className="variance-concept-item">
              <div className="variance-concept-number">
                01
              </div>

              <div>
                <strong>
                  Media
                </strong>

                <p>
                  Representa el valor promedio
                  del conjunto analizado.
                </p>
              </div>
            </div>


            <div className="variance-concept-item">
              <div className="variance-concept-number">
                02
              </div>

              <div>
                <strong>
                  Varianza
                </strong>

                <p>
                  Mide cuánto se dispersan los
                  datos respecto de la media.
                </p>
              </div>
            </div>


            <div className="variance-concept-item">
              <div className="variance-concept-number">
                03
              </div>

              <div>
                <strong>
                  Desviación estándar
                </strong>

                <p>
                  Expresa la dispersión usando
                  las mismas unidades de los
                  datos originales.
                </p>
              </div>
            </div>


            <div className="variance-population-note">
              <Info
                size={15}
              />

              <div>
                <strong>
                  Cálculo poblacional
                </strong>

                <span>
                  El análisis considera el conjunto
                  ingresado como la población completa.
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>


      {loading && (
        <section className="variance-loading">
          <div className="variance-spinner" />

          <strong>
            Procesando datos
          </strong>

          <span>
            Calculando las medidas de dispersión.
          </span>
        </section>
      )}


      {!result &&
        !loading && (
          <section className="variance-empty">
            <div className="variance-empty-icon">
              <BarChart3
                size={26}
              />
            </div>

            <strong>
              Esperando análisis
            </strong>

            <p>
              Ingresa al menos dos valores y
              ejecuta el cálculo para visualizar
              los resultados.
            </p>
          </section>
        )}


      {result &&
        !loading && (
          <>
            <div className="variance-success">
              <CheckCircle2
                size={15}
              />

              Análisis estadístico completado
            </div>


            <section className="variance-kpi-grid">
              <article className="variance-kpi">
                <div className="variance-kpi-top">
                  <span>
                    OBSERVACIONES
                  </span>

                  <BarChart3
                    size={16}
                  />
                </div>

                <strong>
                  {
                    result
                      .observations
                  }
                </strong>

                <small>
                  Datos analizados
                </small>
              </article>


              <article className="variance-kpi">
                <div className="variance-kpi-top">
                  <span>
                    MEDIA
                  </span>

                  <Sigma
                    size={16}
                  />
                </div>

                <strong>
                  {formatNumber(
                    result
                      .expected_value,
                  )}
                </strong>

                <small>
                  Valor promedio
                </small>
              </article>


              <article className="variance-kpi variance-kpi-blue">
                <div className="variance-kpi-top">
                  <span>
                    VARIANZA
                  </span>

                  <Calculator
                    size={16}
                  />
                </div>

                <strong>
                  {formatNumber(
                    result
                      .variance,
                  )}
                </strong>

                <small>
                  Dispersión cuadrática
                </small>
              </article>


              <article className="variance-kpi variance-kpi-cyan">
                <div className="variance-kpi-top">
                  <span>
                    DESVIACIÓN ESTÁNDAR
                  </span>

                  <Sigma
                    size={16}
                  />
                </div>

                <strong>
                  {formatNumber(
                    result
                      .standard_deviation,
                  )}
                </strong>

                <small>
                  Dispersión en unidades originales
                </small>
              </article>
            </section>


            <section className="variance-results-grid">
              <article className="variance-panel variance-chart-panel">
                <header className="variance-panel-header">
                  <div>
                    <span>
                      VISUALIZACIÓN
                    </span>

                    <h2>
                      Valores observados
                    </h2>

                    <p>
                      Comparación respecto de
                      la media y ±1 desviación.
                    </p>
                  </div>

                  <BarChart3
                    size={19}
                  />
                </header>


                <div className="variance-chart">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={
                        chartData
                      }
                      margin={{
                        top: 20,
                        right: 18,
                        left: 0,
                        bottom: 4,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={
                          false
                        }
                        stroke="#e8edf1"
                      />

                      <XAxis
                        dataKey="index"
                        tickLine={
                          false
                        }
                        axisLine={
                          false
                        }
                        fontSize={
                          10
                        }
                      />

                      <YAxis
                        tickLine={
                          false
                        }
                        axisLine={
                          false
                        }
                        fontSize={
                          10
                        }
                      />

                      <Tooltip />

                      <ReferenceLine
                        y={
                          result
                            .expected_value
                        }
                        stroke="#16a34a"
                        strokeDasharray="5 5"
                      />

                      <ReferenceLine
                        y={
                          result
                            .expected_value
                          +
                          result
                            .standard_deviation
                        }
                        stroke="#0ea5b7"
                        strokeDasharray="3 3"
                      />

                      <ReferenceLine
                        y={
                          result
                            .expected_value
                          -
                          result
                            .standard_deviation
                        }
                        stroke="#0ea5b7"
                        strokeDasharray="3 3"
                      />

                      <Bar
                        dataKey="value"
                        fill="#2563eb"
                        radius={[
                          5,
                          5,
                          0,
                          0,
                        ]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>


                <div className="variance-chart-legend">
                  <span>
                    <i className="variance-legend-values" />

                    Valores
                  </span>

                  <span>
                    <i className="variance-legend-mean" />

                    Media
                  </span>

                  <span>
                    <i className="variance-legend-deviation" />

                    ± 1 desviación estándar
                  </span>
                </div>
              </article>


              <article className="variance-panel variance-summary-panel">
                <header className="variance-panel-header">
                  <div>
                    <span>
                      RESUMEN
                    </span>

                    <h2>
                      Lectura estadística
                    </h2>

                    <p>
                      Indicadores derivados del
                      conjunto analizado.
                    </p>
                  </div>

                  <Sigma
                    size={19}
                  />
                </header>


                <div className="variance-summary-body">
                  <div className="variance-summary-row">
                    <span>
                      Valor mínimo
                    </span>

                    <strong>
                      {formatNumber(
                        minimum,
                      )}
                    </strong>
                  </div>


                  <div className="variance-summary-row">
                    <span>
                      Valor máximo
                    </span>

                    <strong>
                      {formatNumber(
                        maximum,
                      )}
                    </strong>
                  </div>


                  <div className="variance-summary-row">
                    <span>
                      Rango
                    </span>

                    <strong>
                      {formatNumber(
                        dataRange,
                      )}
                    </strong>
                  </div>


                  <div className="variance-summary-row">
                    <span>
                      Media
                    </span>

                    <strong>
                      {formatNumber(
                        result
                          .expected_value,
                      )}
                    </strong>
                  </div>


                  <div className="variance-summary-row">
                    <span>
                      Varianza
                    </span>

                    <strong>
                      {formatNumber(
                        result
                          .variance,
                      )}
                    </strong>
                  </div>


                  <div className="variance-summary-row">
                    <span>
                      Desviación estándar
                    </span>

                    <strong>
                      {formatNumber(
                        result
                          .standard_deviation,
                      )}
                    </strong>
                  </div>


                  <div className="variance-interpretation">
                    <span>
                      INTERPRETACIÓN
                    </span>

                    {result
                      .standard_deviation ===
                    0 ? (
                      <p>
                        Todos los valores son iguales.
                        No existe dispersión respecto
                        de la media.
                      </p>
                    ) : (
                      <p>
                        Los valores presentan una
                        desviación estándar de{" "}
                        <strong>
                          {formatNumber(
                            result
                              .standard_deviation,
                          )}
                        </strong>{" "}
                        unidades alrededor de una
                        media de{" "}
                        <strong>
                          {formatNumber(
                            result
                              .expected_value,
                          )}
                        </strong>.
                      </p>
                    )}
                  </div>
                </div>
              </article>
            </section>
          </>
        )}
    </section>
  );
}
