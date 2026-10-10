import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Activity,
  BarChart3,
  CalendarRange,
  CircleGauge,
  ReceiptText,
  RefreshCw,
  Sigma,
  SlidersHorizontal,
  WalletCards,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import ExportActions from "../../components/ui/ExportActions";
import ModuleState from "../../components/ui/ModuleState";

import {
  getSalesBusinessStatistics,
} from "../../services/business-statistics.service";

import {
  getBranches,
} from "../../services/organization.service";

import {
  useApiResource,
} from "../../hooks/useApiResource";

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
  SalesBusinessStatistics,
} from "../../types/business-statistics";

import "./statistics.css";


function inputDate(
  date: Date,
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(
      2,
      "0",
    );

  const day =
    String(
      date.getDate(),
    ).padStart(
      2,
      "0",
    );

  return `${year}-${month}-${day}`;
}


function dateOffset(
  offset: number,
) {
  const date =
    new Date();

  date.setDate(
    date.getDate()
      + offset,
  );

  return inputDate(
    date,
  );
}


function formatCurrency(
  value: number,
) {
  return new Intl.NumberFormat(
    "es-PE",
    {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(
    value,
  );
}


function formatNumber(
  value: number,
  digits = 2,
) {
  return new Intl.NumberFormat(
    "es-PE",
    {
      maximumFractionDigits:
        digits,
    },
  ).format(
    value,
  );
}


const INITIAL_START =
  dateOffset(-29);

const INITIAL_END =
  dateOffset(0);


export default function StatisticsPage() {
  const exportRef =
    useRef<HTMLElement>(
      null,
    );

  const branchesResource =
    useApiResource(
      getBranches,
    );

  const [
    startDate,
    setStartDate,
  ] =
    useState(
      INITIAL_START,
    );

  const [
    endDate,
    setEndDate,
  ] =
    useState(
      INITIAL_END,
    );

  const [
    period,
    setPeriod,
  ] =
    useState("30");

  const [
    branchId,
    setBranchId,
  ] =
    useState("");

  const [
    statistics,
    setStatistics,
  ] =
    useState<
      SalesBusinessStatistics
      | null
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

  const [
    exportError,
    setExportError,
  ] =
    useState("");


  const branches =
    useMemo(
      () =>
        (
          branchesResource.data
          ?? []
        ).filter(
          (branch) =>
            branch.status
            === "active",
        ),
      [
        branchesResource.data,
      ],
    );


  async function loadStatistics(
    from =
      startDate,

    to =
      endDate,

    selectedBranch =
      branchId,
  ) {
    if (
      from > to
    ) {
      setError(
        "La fecha inicial no puede ser posterior a la fecha final.",
      );

      return;
    }

    setLoading(
      true,
    );

    setError("");

    try {
      const response =
        await getSalesBusinessStatistics({
          startDate:
            from,

          endDate:
            to,

          branchId:
            selectedBranch
            || undefined,
        });

      setStatistics(
        response,
      );
    } catch (
      currentError
    ) {
      setStatistics(
        null,
      );

      setError(
        currentError
          instanceof Error
          ? currentError.message
          : "No se pudieron cargar las estadísticas.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }


  useEffect(
    () => {
      void loadStatistics(
        INITIAL_START,
        INITIAL_END,
        "",
      );
    },
    [],
  );


  function selectPeriod(
    value: string,
  ) {
    setPeriod(
      value,
    );

    if (
      value ===
      "custom"
    ) {
      return;
    }

    const days =
      Number(value);

    const from =
      dateOffset(
        -(days - 1),
      );

    const to =
      dateOffset(0);

    setStartDate(
      from,
    );

    setEndDate(
      to,
    );
  }


  const variabilityClass =
    statistics
      ?.variability_label
      .toLowerCase()
      .replace(
        /\s+/g,
        "-",
      )
    ?? "";


  function exportRows():
    ExportRow[] {
    if (!statistics) {
      return [];
    }

    return [
      {
        Sucursal:
          statistics
            .branch_name,

        "Ventas analizadas":
          statistics.count,

        "Ingresos":
          statistics
            .total_revenue,

        "Ticket promedio":
          statistics.mean,

        Mediana:
          statistics.median,

        "Desviación estándar":
          statistics
            .standard_deviation,

        Varianza:
          statistics.variance,

        Mínimo:
          statistics.minimum,

        Máximo:
          statistics.maximum,

        "Coeficiente de variación %":
          statistics
            .coefficient_variation,

        Variabilidad:
          statistics
            .variability_label,
      },
    ];
  }


  function exportFilename() {
    return `estadisticas-${exportDateStamp()}`;
  }


  async function handlePdf() {
    if (
      !exportRef.current
      || !statistics
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
        currentError
          instanceof Error
          ? currentError.message
          : "No se pudo generar el PDF.",
      );
    }
  }


  function handleCsv() {
    if (!statistics) {
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
        currentError
          instanceof Error
          ? currentError.message
          : "No se pudo generar el CSV.",
      );
    }
  }


  async function handleExcel() {
    if (!statistics) {
      return;
    }

    setExportError("");

    try {
      await exportRowsToExcel(
        exportFilename(),
        "Estadísticas",
        exportRows(),
      );
    } catch (
      currentError
    ) {
      setExportError(
        currentError
          instanceof Error
          ? currentError.message
          : "No se pudo generar el Excel.",
      );
    }
  }


  async function handleShare() {
    if (
      !exportRef.current
      || !statistics
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
        "Estadísticas comerciales - SalesIA",
        "Resumen estadístico de las ventas seleccionadas.",
      );
    } catch (
      currentError
    ) {
      setExportError(
        currentError
          instanceof Error
          ? currentError.message
          : "No se pudo compartir el análisis.",
      );
    }
  }


  return (
    <section
      ref={exportRef}
      className="business-statistics-page"
    >
      <header className="business-statistics-header">
        <div>
          <div className="business-statistics-eyebrow">
            <Sigma
              size={15}
            />

            Inteligencia comercial
          </div>

          <h1>
            Estadísticas
          </h1>

          <p>
            Comprende cómo se distribuyen los importes de tus ventas sin necesidad de ingresar datos manualmente.
          </p>
        </div>

        <div
          className="business-statistics-actions"
          data-export-hide="true"
        >
          {statistics && (
            <ExportActions
              disabled={
                loading
              }
              onPdf={
                handlePdf
              }
              onCsv={
                handleCsv
              }
              onExcel={
                handleExcel
              }
              onShare={
                handleShare
              }
            />
          )}

          <button
            type="button"
            className="business-statistics-refresh"
            disabled={
              loading
            }
            onClick={() =>
              void loadStatistics()
            }
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "business-statistics-spin"
                  : ""
              }
            />

            Actualizar
          </button>
        </div>
      </header>


      <section
        className="business-statistics-filters"
        data-export-hide="true"
      >
        <label>
          <span>
            Periodo
          </span>

          <select
            value={
              period
            }
            onChange={(
              event,
            ) =>
              selectPeriod(
                event.target.value,
              )
            }
          >
            <option value="7">
              Últimos 7 días
            </option>

            <option value="30">
              Últimos 30 días
            </option>

            <option value="90">
              Últimos 90 días
            </option>

            <option value="custom">
              Personalizado
            </option>
          </select>
        </label>

        <label>
          <span>
            Desde
          </span>

          <input
            type="date"
            value={
              startDate
            }
            onChange={(
              event,
            ) => {
              setStartDate(
                event.target.value,
              );

              setPeriod(
                "custom",
              );
            }}
          />
        </label>

        <label>
          <span>
            Hasta
          </span>

          <input
            type="date"
            value={
              endDate
            }
            onChange={(
              event,
            ) => {
              setEndDate(
                event.target.value,
              );

              setPeriod(
                "custom",
              );
            }}
          />
        </label>

        <label>
          <span>
            Sucursal
          </span>

          <select
            value={
              branchId
            }
            disabled={
              branchesResource
                .loading
            }
            onChange={(
              event,
            ) =>
              setBranchId(
                event.target.value,
              )
            }
          >
            <option value="">
              Todas las sucursales
            </option>

            {branches.map(
              (branch) => (
                <option
                  key={
                    branch.id
                  }
                  value={
                    branch.id
                  }
                >
                  {branch.name}
                </option>
              ),
            )}
          </select>
        </label>

        <button
          type="button"
          className="business-statistics-apply"
          disabled={
            loading
          }
          onClick={() =>
            void loadStatistics()
          }
        >
          <CalendarRange
            size={16}
          />

          Aplicar
        </button>
      </section>


      {error && (
        <ModuleState
          type="error"
          title="No se pudieron cargar las estadísticas"
          description={
            error
          }
        />
      )}

      {exportError && (
        <div className="business-statistics-error">
          {exportError}
        </div>
      )}


      {loading &&
      !statistics ? (
        <ModuleState
          type="loading"
          title="Calculando estadísticas"
          description="Analizando las ventas registradas..."
        />
      ) : statistics ? (
        statistics.count === 0 ? (
          <ModuleState
            type="empty"
            title="No hay ventas en este periodo"
            description="Cambia el periodo o selecciona otra sucursal para consultar sus estadísticas."
          />
        ) : (
          <>
            <section className="business-statistics-kpis">
              <article>
                <div className="business-statistics-icon">
                  <ReceiptText
                    size={18}
                  />
                </div>

                <span>
                  Ventas analizadas
                </span>

                <strong>
                  {
                    statistics
                      .count
                  }
                </strong>

                <small>
                  Operaciones completadas
                </small>
              </article>

              <article>
                <div className="business-statistics-icon">
                  <WalletCards
                    size={18}
                  />
                </div>

                <span>
                  Ticket promedio
                </span>

                <strong>
                  {formatCurrency(
                    statistics.mean,
                  )}
                </strong>

                <small>
                  Promedio por venta
                </small>
              </article>

              <article>
                <div className="business-statistics-icon">
                  <BarChart3
                    size={18}
                  />
                </div>

                <span>
                  Ticket mediano
                </span>

                <strong>
                  {formatCurrency(
                    statistics.median,
                  )}
                </strong>

                <small>
                  Valor central
                </small>
              </article>

              <article>
                <div className="business-statistics-icon">
                  <CircleGauge
                    size={18}
                  />
                </div>

                <span>
                  Variabilidad
                </span>

                <strong
                  className={
                    `variability-${variabilityClass}`
                  }
                >
                  {
                    statistics
                      .variability_label
                  }
                </strong>

                <small>
                  CV{" "}
                  {formatNumber(
                    statistics
                      .coefficient_variation,
                    1,
                  )}
                  %
                </small>
              </article>
            </section>


            <section className="business-statistics-summary">
              <div className="business-statistics-summary-icon">
                <Activity
                  size={22}
                />
              </div>

              <div>
                <span>
                  LECTURA ESTADÍSTICA
                </span>

                <h2>
                  ¿Qué significan estos datos?
                </h2>

                <p>
                  {
                    statistics
                      .interpretation
                  }
                </p>
              </div>

              <div className="business-statistics-total">
                <span>
                  Ingresos analizados
                </span>

                <strong>
                  {formatCurrency(
                    statistics
                      .total_revenue,
                  )}
                </strong>

                <small>
                  {
                    statistics
                      .branch_name
                  }
                </small>
              </div>
            </section>


            <section className="business-statistics-main-grid">
              <article className="business-statistics-panel">
                <header className="business-statistics-panel-header">
                  <div>
                    <span>
                      DISTRIBUCIÓN
                    </span>

                    <h2>
                      ¿Cómo se agrupan los tickets?
                    </h2>

                    <p>
                      Cantidad de ventas dentro de cada rango de importe.
                    </p>
                  </div>

                  <BarChart3
                    size={19}
                  />
                </header>

                <div className="business-statistics-chart">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={
                        statistics
                          .distribution
                      }
                      margin={{
                        top: 10,
                        right: 10,
                        bottom: 8,
                        left: 0,
                      }}
                    >
                      <CartesianGrid
                        vertical={
                          false
                        }
                        stroke="#e8eef5"
                        strokeDasharray="4 4"
                      />

                      <XAxis
                        dataKey="label"
                        axisLine={
                          false
                        }
                        tickLine={
                          false
                        }
                        interval={
                          0
                        }
                        tick={{
                          fill:
                            "#64748b",
                          fontSize:
                            9,
                        }}
                      />

                      <YAxis
                        allowDecimals={
                          false
                        }
                        axisLine={
                          false
                        }
                        tickLine={
                          false
                        }
                        tick={{
                          fill:
                            "#64748b",
                          fontSize:
                            10,
                        }}
                      />

                      <Tooltip
                        formatter={(
                          value,
                        ) => [
                          `${value} ventas`,
                          "Cantidad",
                        ]}
                      />

                      <Bar
                        dataKey="count"
                        name="Cantidad"
                        fill="#0891b2"
                        radius={[
                          5,
                          5,
                          0,
                          0,
                        ]}
                        maxBarSize={
                          54
                        }
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>


              <aside className="business-statistics-panel">
                <header className="business-statistics-panel-header">
                  <div>
                    <span>
                      RANGO DE VENTAS
                    </span>

                    <h2>
                      Valores principales
                    </h2>
                  </div>

                  <SlidersHorizontal
                    size={19}
                  />
                </header>

                <div className="business-statistics-reading">
                  <div>
                    <span>
                      Venta mínima
                    </span>

                    <strong>
                      {formatCurrency(
                        statistics.minimum,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      25% de las ventas hasta
                    </span>

                    <strong>
                      {formatCurrency(
                        statistics.q1,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Mediana
                    </span>

                    <strong>
                      {formatCurrency(
                        statistics.median,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      75% de las ventas hasta
                    </span>

                    <strong>
                      {formatCurrency(
                        statistics.q3,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Venta máxima
                    </span>

                    <strong>
                      {formatCurrency(
                        statistics.maximum,
                      )}
                    </strong>
                  </div>
                </div>
              </aside>
            </section>


            <details className="business-statistics-advanced">
              <summary>
                <span>
                  <Sigma
                    size={18}
                  />

                  Estadística avanzada
                </span>

                <small>
                  Varianza, desviación, rango y cuartiles
                </small>
              </summary>

              <div className="business-statistics-advanced-grid">
                <article>
                  <span>
                    Desviación estándar
                  </span>

                  <strong>
                    {formatCurrency(
                      statistics
                        .standard_deviation,
                    )}
                  </strong>

                  <small>
                    Distancia típica respecto del promedio
                  </small>
                </article>

                <article>
                  <span>
                    Varianza
                  </span>

                  <strong>
                    {formatNumber(
                      statistics
                        .variance,
                      2,
                    )}
                  </strong>

                  <small>
                    Dispersión estadística al cuadrado
                  </small>
                </article>

                <article>
                  <span>
                    Rango
                  </span>

                  <strong>
                    {formatCurrency(
                      statistics
                        .range_value,
                    )}
                  </strong>

                  <small>
                    Máximo menos mínimo
                  </small>
                </article>

                <article>
                  <span>
                    Rango intercuartílico
                  </span>

                  <strong>
                    {formatCurrency(
                      statistics.iqr,
                    )}
                  </strong>

                  <small>
                    Dispersión del 50% central
                  </small>
                </article>

                <article>
                  <span>
                    Coeficiente de variación
                  </span>

                  <strong>
                    {formatNumber(
                      statistics
                        .coefficient_variation,
                      1,
                    )}
                    %
                  </strong>

                  <small>
                    Variación relativa frente al promedio
                  </small>
                </article>

                <article>
                  <span>
                    Ingresos del periodo
                  </span>

                  <strong>
                    {formatCurrency(
                      statistics
                        .total_revenue,
                    )}
                  </strong>

                  <small>
                    Total de ventas analizadas
                  </small>
                </article>
              </div>
            </details>


            <details className="business-statistics-help">
              <summary>
                ¿Cómo interpretar estas estadísticas?
              </summary>

              <div>
                <p>
                  <strong>
                    Promedio:
                  </strong>
                  {" "}
                  importe medio de una venta.
                </p>

                <p>
                  <strong>
                    Mediana:
                  </strong>
                  {" "}
                  la mitad de las ventas queda por debajo y la otra mitad por encima.
                </p>

                <p>
                  <strong>
                    Desviación estándar:
                  </strong>
                  {" "}
                  indica cuánto suelen alejarse los tickets de su promedio.
                </p>

                <p>
                  <strong>
                    Coeficiente de variación:
                  </strong>
                  {" "}
                  permite resumir la variabilidad como baja, media o alta.
                </p>
              </div>
            </details>
          </>
        )
      ) : null}
    </section>
  );
}
