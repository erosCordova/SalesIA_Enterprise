import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Boxes,
  Building2,
  CalendarRange,
  ClipboardList,
  ExternalLink,
  FileText,
  PackageSearch,
  RefreshCw,
  Search,
  ShoppingCart,
  Sparkles,
  Users,
} from "lucide-react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import ExportActions from "../../components/ui/ExportActions";
import ModuleState from "../../components/ui/ModuleState";

import {
  useApiResource,
} from "../../hooks/useApiResource";

import {
  getBranches,
} from "../../services/organization.service";

import {
  getBusinessReport,
  getReports,
} from "../../services/reporting.service";

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
  BusinessReportColumn,
  BusinessReportResponse,
  BusinessReportType,
  ReportItem,
} from "../../types/reporting";

import "./reports-commercial.css";


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
  days: number,
) {
  const date =
    new Date();

  date.setDate(
    date.getDate()
    + days,
  );

  return inputDate(
    date,
  );
}


function normalize(
  value:
    | string
    | null
    | undefined,
) {
  return (
    value
      ?.normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .trim()
      .toLowerCase()
    ?? ""
  );
}


function formatCurrency(
  value: unknown,
) {
  const number =
    Number(value);

  return new Intl.NumberFormat(
    "es-PE",
    {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(
    Number.isFinite(
      number,
    )
      ? number
      : 0,
  );
}


function formatNumber(
  value: unknown,
) {
  const number =
    Number(value);

  return new Intl.NumberFormat(
    "es-PE",
    {
      maximumFractionDigits: 2,
    },
  ).format(
    Number.isFinite(
      number,
    )
      ? number
      : 0,
  );
}


function formatCompactCurrency(
  value: unknown,
) {
  const number =
    Number(value);

  return new Intl.NumberFormat(
    "es-PE",
    {
      notation: "compact",
      maximumFractionDigits: 1,
    },
  ).format(
    Number.isFinite(
      number,
    )
      ? number
      : 0,
  );
}


function numericValue(
  value: unknown,
) {
  const number =
    Number(value);

  return Number.isFinite(
    number,
  )
    ? number
    : 0;
}


function shortText(
  value: unknown,
  maxLength = 18,
) {
  const text =
    String(
      value ?? "",
    );

  if (
    text.length
    <= maxLength
  ) {
    return text;
  }

  return (
    text.slice(
      0,
      maxLength - 1,
    )
    + "…"
  );
}


function shortDate(
  value: unknown,
) {
  const raw =
    String(
      value ?? "",
    );

  const date =
    new Date(
      raw.length === 10
        ? `${raw}T00:00:00`
        : raw,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return raw;
  }

  return new Intl.DateTimeFormat(
    "es-PE",
    {
      day: "2-digit",
      month: "short",
    },
  ).format(
    date,
  );
}


function formatDate(
  value: string,
) {
  const normalized =
    value.length === 10
      ? `${value}T00:00:00`
      : value;

  const date =
    new Date(
      normalized,
    );

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
    },
  ).format(
    date,
  );
}


function translateStatus(
  value: string,
) {
  const dictionary:
    Record<string, string> = {
      ready:
        "Disponible",

      completed:
        "Completado",

      pending:
        "Pendiente",

      processing:
        "Procesando",

      generating:
        "Generando",

      failed:
        "Error",

      error:
        "Error",
    };

  return (
    dictionary[
      normalize(value)
    ]
    ?? value
  );
}


function translateReportType(
  value: string,
) {
  const dictionary:
    Record<string, string> = {
      sales:
        "Ventas",

      branches:
        "Ventas por sucursal",

      products:
        "Productos",

      customers:
        "Clientes",

      inventory:
        "Inventario",

      kardex:
        "Kardex",

      revenue:
        "Ingresos",

      analytics:
        "Análisis",

      commercial:
        "Comercial",
    };

  return (
    dictionary[
      normalize(value)
    ]
    ?? value
  );
}


function statusClass(
  value: string,
) {
  const status =
    normalize(value);

  if (
    status === "ready"
    || status === "completed"
  ) {
    return (
      "reports-status success"
    );
  }

  if (
    status === "pending"
    || status === "processing"
    || status === "generating"
  ) {
    return (
      "reports-status pending"
    );
  }

  if (
    status === "failed"
    || status === "error"
  ) {
    return (
      "reports-status error"
    );
  }

  return "reports-status";
}


const INITIAL_START =
  dateOffset(-29);

const INITIAL_END =
  dateOffset(0);


const REPORT_BRANCH_SUPPORT:
  Record<
    BusinessReportType,
    boolean
  > = {
    sales: true,
    branches: false,
    products: true,
    customers: true,
    inventory: false,
    kardex: false,
  };


type ReportsChartKind =
  | "sales"
  | "branches"
  | "products"
  | "customers"
  | "inventory"
  | "kardex";


type ReportsChartPoint =
  Record<
    string,
    string | number
  >;


interface ReportsChartModel {
  kind:
    ReportsChartKind;

  title: string;
  description: string;

  data:
    ReportsChartPoint[];

  primaryKey: string;
  primaryLabel: string;

  secondaryKey: string;
  secondaryLabel: string;

  currency: boolean;
}


export default function ReportsPage() {
  const exportRef =
    useRef<HTMLElement>(
      null,
    );

  const branchesResource =
    useApiResource(
      getBranches,
    );

  const {
    data: reportsData,
    loading: reportsLoading,
    error: reportsError,
    reload: reloadReports,
  } =
    useApiResource<
      ReportItem[]
    >(
      getReports,
    );


  const [
    reportType,
    setReportType,
  ] =
    useState<
      BusinessReportType
    >(
      "sales",
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
    branchId,
    setBranchId,
  ] =
    useState("");

  const [
    report,
    setReport,
  ] =
    useState<
      BusinessReportResponse
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

  const [
    exportSuccess,
    setExportSuccess,
  ] =
    useState("");

  const [
    reportSearch,
    setReportSearch,
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


  const reports =
    reportsData
    ?? [];


  const filteredReports =
    useMemo(
      () => {
        const query =
          normalize(
            reportSearch,
          );

        if (!query) {
          return reports;
        }

        return reports.filter(
          (item) =>
            normalize(
              item.name,
            ).includes(
              query,
            )
            || normalize(
              item.report_type,
            ).includes(
              query,
            )
            || normalize(
              item.status,
            ).includes(
              query,
            ),
        );
      },
      [
        reports,
        reportSearch,
      ],
    );


  async function generateReport(
    selectedType =
      reportType,

    selectedBranch =
      branchId,

    selectedStart =
      startDate,

    selectedEnd =
      endDate,
  ) {
    if (
      selectedStart
      > selectedEnd
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
    setExportError("");
    setExportSuccess("");

    try {
      const supportsBranch =
        REPORT_BRANCH_SUPPORT[
          selectedType
        ];

      const response =
        await getBusinessReport({
          reportType:
            selectedType,

          startDate:
            selectedStart,

          endDate:
            selectedEnd,

          branchId:
            supportsBranch
              ? selectedBranch
                || undefined
              : undefined,
        });

      setReport(
        response,
      );
    } catch (
      currentError
    ) {
      setReport(
        null,
      );

      setError(
        currentError
          instanceof Error
          ? currentError.message
          : "No se pudo generar el reporte.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }


  useEffect(
    () => {
      void generateReport(
        "sales",
        "",
        INITIAL_START,
        INITIAL_END,
      );
    },
    [],
  );


  function selectReportType(
    value: string,
  ) {
    switch (value) {
      case "sales":
      case "branches":
      case "products":
      case "customers":
      case "inventory":
      case "kardex":
        setReportType(
          value,
        );

        if (
          !REPORT_BRANCH_SUPPORT[
            value
          ]
        ) {
          setBranchId("");
        }

        break;

      default:
        break;
    }
  }


  function selectQuickReport(
    type:
      BusinessReportType,
  ) {
    selectReportType(
      type,
    );

    void generateReport(
      type,
      REPORT_BRANCH_SUPPORT[
        type
      ]
        ? branchId
        : "",
      startDate,
      endDate,
    );
  }


  function applyPeriod(
    days: number,
  ) {
    setStartDate(
      dateOffset(
        -(days - 1),
      ),
    );

    setEndDate(
      dateOffset(0),
    );
  }


  function formatCell(
    column:
      BusinessReportColumn,

    value: unknown,
  ) {
    if (
      value === null
      || value === undefined
      || value === ""
    ) {
      return "—";
    }

    if (
      column.format
      === "currency"
    ) {
      return formatCurrency(
        value,
      );
    }

    if (
      column.format
      === "number"
    ) {
      return formatNumber(
        value,
      );
    }

    if (
      column.format
      === "date"
    ) {
      return formatDate(
        String(value),
      );
    }

    return String(value);
  }


  function formatSummary(
    value:
      string | number,

    format: string,
  ) {
    if (
      format === "currency"
    ) {
      return formatCurrency(
        value,
      );
    }

    if (
      format === "number"
    ) {
      return formatNumber(
        value,
      );
    }

    return String(value);
  }


  function exportRows():
    ExportRow[] {
    if (!report) {
      return [];
    }

    return report.rows.map(
      (row) => {
        const exportRow:
          ExportRow = {};

        report.columns.forEach(
          (column) => {
            exportRow[
              column.label
            ] =
              formatCell(
                column,
                row[
                  column.key
                ],
              );
          },
        );

        return exportRow;
      },
    );
  }


  function exportFilename() {
    const type =
      report
        ?.report_type
      ?? reportType;

    return (
      `reporte-${type}-`
      + `${startDate}-${endDate}-`
      + exportDateStamp()
    );
  }


  async function handlePdf() {
    if (
      !exportRef.current
      || !report
    ) {
      return;
    }

    setExportError("");
    setExportSuccess("");

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
    if (!report) {
      return;
    }

    setExportError("");
    setExportSuccess("");

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
    if (!report) {
      return;
    }

    setExportError("");
    setExportSuccess("");

    try {
      await exportRowsToExcel(
        exportFilename(),
        "Reporte",
        exportRows(),
      );
    } catch (
      currentError
    ) {
      setExportError(
        currentError
          instanceof Error
          ? currentError.message
          : "No se pudo generar el archivo Excel.",
      );
    }
  }


  async function handleShare() {
    if (
      !exportRef.current
      || !report
    ) {
      return;
    }

    setExportError("");
    setExportSuccess("");

    try {
      const file =
        await createVisualPdfFile(
          exportRef.current,
          exportFilename(),
        );

      const result =
        await shareFile(
          file,
          `Reporte - ${report.title}`,
          report.description,
        );

      if (
        result ===
        "downloaded"
      ) {
        setExportSuccess(
          "El PDF fue descargado para compartirlo manualmente.",
        );
      }
    } catch (
      currentError
    ) {
      setExportError(
        currentError
          instanceof Error
          ? currentError.message
          : "No se pudo compartir el reporte.",
      );
    }
  }


  async function refreshAll() {
    await Promise.all([
      generateReport(),
      reloadReports(),
      branchesResource.reload(),
    ]);
  }


  const chartModel =
    useMemo<
      ReportsChartModel | null
    >(
      () => {
        if (
          !report
          || report.rows.length === 0
        ) {
          return null;
        }


        if (
          report.report_type
          === "sales"
        ) {
          const grouped =
            new Map<
              string,
              {
                label: string;
                revenue: number;
                sales: number;
              }
            >();

          report.rows.forEach(
            (row) => {
              const date =
                String(
                  row.sale_date
                  ?? "",
                );

              const current =
                grouped.get(
                  date,
                )
                ?? {
                  label:
                    shortDate(
                      date,
                    ),

                  revenue: 0,
                  sales: 0,
                };

              current.revenue +=
                numericValue(
                  row.total,
                );

              current.sales += 1;

              grouped.set(
                date,
                current,
              );
            },
          );

          return {
            kind: "sales",

            title:
              "Evolución de ventas",

            description:
              "Ingresos y cantidad de operaciones registradas por día.",

            data:
              Array.from(
                grouped.entries(),
              )
                .sort(
                  (
                    left,
                    right,
                  ) =>
                    left[0]
                      .localeCompare(
                        right[0],
                      ),
                )
                .map(
                  (
                    [
                      ,
                      value,
                    ],
                  ) =>
                    value,
                ),

            primaryKey:
              "revenue",

            primaryLabel:
              "Ingresos",

            secondaryKey:
              "sales",

            secondaryLabel:
              "Ventas",

            currency: true,
          };
        }


        if (
          report.report_type
          === "branches"
        ) {
          return {
            kind: "branches",

            title:
              "Comparación por sucursal",

            description:
              "Ingresos generados por cada sucursal durante el periodo.",

            data:
              report.rows
                .slice(
                  0,
                  10,
                )
                .map(
                  (row) => ({
                    label:
                      shortText(
                        row.branch,
                        20,
                      ),

                    revenue:
                      numericValue(
                        row.revenue,
                      ),

                    sales:
                      numericValue(
                        row.sales,
                      ),
                  }),
                ),

            primaryKey:
              "revenue",

            primaryLabel:
              "Ingresos",

            secondaryKey:
              "sales",

            secondaryLabel:
              "Ventas",

            currency: true,
          };
        }


        if (
          report.report_type
          === "products"
        ) {
          return {
            kind: "products",

            title:
              "Productos más vendidos",

            description:
              "Ranking según la cantidad de unidades vendidas.",

            data:
              report.rows
                .slice(
                  0,
                  10,
                )
                .map(
                  (row) => ({
                    label:
                      shortText(
                        row.product,
                        22,
                      ),

                    units:
                      numericValue(
                        row.units,
                      ),

                    revenue:
                      numericValue(
                        row.revenue,
                      ),
                  }),
                ),

            primaryKey:
              "units",

            primaryLabel:
              "Unidades",

            secondaryKey:
              "",

            secondaryLabel:
              "",

            currency: false,
          };
        }


        if (
          report.report_type
          === "customers"
        ) {
          return {
            kind: "customers",

            title:
              "Clientes con mayor compra",

            description:
              "Clientes ordenados por el importe total comprado.",

            data:
              report.rows
                .slice(
                  0,
                  10,
                )
                .map(
                  (row) => ({
                    label:
                      shortText(
                        row.customer,
                        22,
                      ),

                    total:
                      numericValue(
                        row.total_spent,
                      ),

                    purchases:
                      numericValue(
                        row.purchases,
                      ),
                  }),
                ),

            primaryKey:
              "total",

            primaryLabel:
              "Total comprado",

            secondaryKey:
              "",

            secondaryLabel:
              "",

            currency: true,
          };
        }


        if (
          report.report_type
          === "inventory"
        ) {
          const counts =
            new Map<
              string,
              number
            >();

          report.rows.forEach(
            (row) => {
              const status =
                String(
                  row.status
                  ?? "Sin estado",
                );

              counts.set(
                status,
                (
                  counts.get(
                    status,
                  )
                  ?? 0
                ) + 1,
              );
            },
          );

          return {
            kind: "inventory",

            title:
              "Estado del inventario",

            description:
              "Distribución de productos según su nivel actual de stock.",

            data:
              Array.from(
                counts.entries(),
              ).map(
                (
                  [
                    label,
                    products,
                  ],
                ) => ({
                  label,
                  products,
                }),
              ),

            primaryKey:
              "products",

            primaryLabel:
              "Productos",

            secondaryKey:
              "",

            secondaryLabel:
              "",

            currency: false,
          };
        }


        const grouped =
          new Map<
            string,
            {
              label: string;
              entries: number;
              exits: number;
            }
          >();

        report.rows.forEach(
          (row) => {
            const rawDate =
              String(
                row.movement_date
                ?? "",
              );

            const date =
              rawDate.slice(
                0,
                10,
              );

            const current =
              grouped.get(
                date,
              )
              ?? {
                label:
                  shortDate(
                    date,
                  ),

                entries: 0,
                exits: 0,
              };

            const movement =
              normalize(
                String(
                  row.movement_type
                  ?? "",
                ),
              );

            if (
              movement ===
              "entrada"
            ) {
              current.entries +=
                numericValue(
                  row.quantity,
                );
            }

            if (
              movement ===
              "salida"
            ) {
              current.exits +=
                numericValue(
                  row.quantity,
                );
            }

            grouped.set(
              date,
              current,
            );
          },
        );

        return {
          kind: "kardex",

          title:
            "Movimientos de inventario",

          description:
            "Comparación de entradas y salidas registradas por fecha.",

          data:
            Array.from(
              grouped.entries(),
            )
              .sort(
                (
                  left,
                  right,
                ) =>
                  left[0]
                    .localeCompare(
                      right[0],
                    ),
              )
              .map(
                (
                  [
                    ,
                    value,
                  ],
                ) =>
                  value,
              ),

          primaryKey:
            "entries",

          primaryLabel:
            "Entradas",

          secondaryKey:
            "exits",

          secondaryLabel:
            "Salidas",

          currency: false,
        };
      },
      [
        report,
      ],
    );


  const branchEnabled =
    REPORT_BRANCH_SUPPORT[
      reportType
    ];


  return (
    <section
      ref={exportRef}
      className="reports-page"
    >
      <header className="reports-header">
        <div>
          <div className="reports-eyebrow">
            <FileText
              size={14}
            />

            Información empresarial
          </div>

          <h1>
            Reportes
          </h1>

          <p>
            Genera reportes claros a partir de la información real registrada en SalesIA.
          </p>

          {report && (
            <span className="reports-period-caption">
              {report.title}
              {" · "}
              {report.start_date}
              {" al "}
              {report.end_date}
            </span>
          )}
        </div>


        <div
          className="reports-header-actions"
          data-export-hide="true"
        >
          <ExportActions
            disabled={
              loading
              || !report
              || report.rows
                  .length === 0
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

          <button
            type="button"
            className="reports-refresh-button"
            disabled={
              loading
            }
            onClick={() =>
              void refreshAll()
            }
          >
            <RefreshCw
              size={15}
            />

            Actualizar
          </button>
        </div>
      </header>


      <section
        className="reports-builder"
        data-export-hide="true"
      >
        <div className="reports-builder-heading">
          <div>
            <span>
              CREAR REPORTE
            </span>

            <h2>
              ¿Qué deseas consultar?
            </h2>

            <p>
              Elige el tipo de información, periodo y sucursal cuando corresponda.
            </p>
          </div>

          <Sparkles
            size={20}
          />
        </div>


        <div className="reports-builder-fields">
          <label>
            <span>
              Tipo de reporte
            </span>

            <select
              value={
                reportType
              }
              onChange={(
                event,
              ) =>
                selectReportType(
                  event.target.value,
                )
              }
            >
              <option value="sales">
                Ventas
              </option>

              <option value="branches">
                Ventas por sucursal
              </option>

              <option value="products">
                Productos más vendidos
              </option>

              <option value="customers">
                Clientes
              </option>

              <option value="inventory">
                Inventario
              </option>

              <option value="kardex">
                Kardex
              </option>
            </select>
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
                !branchEnabled
                || branchesResource
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
                {branchEnabled
                  ? "Todas las sucursales"
                  : "No aplica"}
              </option>

              {branchEnabled
                && branches.map(
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
              ) =>
                setStartDate(
                  event.target.value,
                )
              }
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
              ) =>
                setEndDate(
                  event.target.value,
                )
              }
            />
          </label>


          <button
            type="button"
            className="reports-apply-button reports-generate-button"
            disabled={
              loading
            }
            onClick={() =>
              void generateReport()
            }
          >
            <CalendarRange
              size={15}
            />

            {loading
              ? "Generando..."
              : "Generar reporte"}
          </button>
        </div>


        <div className="reports-period-presets reports-builder-presets">
          <button
            type="button"
            onClick={() =>
              applyPeriod(7)
            }
          >
            7 días
          </button>

          <button
            type="button"
            onClick={() =>
              applyPeriod(30)
            }
          >
            30 días
          </button>

          <button
            type="button"
            onClick={() =>
              applyPeriod(90)
            }
          >
            90 días
          </button>
        </div>
      </section>


      <section
        className="reports-quick-section"
        data-export-hide="true"
      >
        <div className="reports-quick-heading">
          <span>
            REPORTES RÁPIDOS
          </span>

          <h2>
            Consultas frecuentes
          </h2>
        </div>

        <div className="reports-quick-grid">
          <button
            type="button"
            onClick={() =>
              selectQuickReport(
                "sales",
              )
            }
          >
            <ShoppingCart
              size={20}
            />

            <strong>
              Ventas
            </strong>

            <span>
              Operaciones del periodo
            </span>
          </button>


          <button
            type="button"
            onClick={() =>
              selectQuickReport(
                "branches",
              )
            }
          >
            <Building2
              size={20}
            />

            <strong>
              Por sucursal
            </strong>

            <span>
              Compara resultados
            </span>
          </button>


          <button
            type="button"
            onClick={() =>
              selectQuickReport(
                "products",
              )
            }
          >
            <PackageSearch
              size={20}
            />

            <strong>
              Productos
            </strong>

            <span>
              Los más vendidos
            </span>
          </button>


          <button
            type="button"
            onClick={() =>
              selectQuickReport(
                "customers",
              )
            }
          >
            <Users
              size={20}
            />

            <strong>
              Clientes
            </strong>

            <span>
              Compras y actividad
            </span>
          </button>


          <button
            type="button"
            onClick={() =>
              selectQuickReport(
                "inventory",
              )
            }
          >
            <Boxes
              size={20}
            />

            <strong>
              Inventario
            </strong>

            <span>
              Estado actual
            </span>
          </button>


          <button
            type="button"
            onClick={() =>
              selectQuickReport(
                "kardex",
              )
            }
          >
            <ClipboardList
              size={20}
            />

            <strong>
              Kardex
            </strong>

            <span>
              Entradas y salidas
            </span>
          </button>
        </div>
      </section>


      {exportError && (
        <div className="reports-message-error">
          {exportError}
        </div>
      )}

      {exportSuccess && (
        <div className="reports-message-success">
          {exportSuccess}
        </div>
      )}


      {error && (
        <ModuleState
          type="error"
          title="No se pudo generar el reporte"
          description={
            error
          }
        />
      )}


      {loading &&
      !report ? (
        <ModuleState
          type="loading"
          title="Preparando reporte"
          description="Consultando la información registrada..."
        />
      ) : report ? (
        <>
          <section className="reports-summary-grid">
            {report.summary.map(
              (item) => (
                <article
                  className="reports-kpi"
                  key={
                    item.key
                  }
                >
                  <div className="reports-kpi-icon">
                    <FileText
                      size={18}
                    />
                  </div>

                  <div>
                    <span>
                      {item.label}
                    </span>

                    <strong>
                      {formatSummary(
                        item.value,
                        item.format,
                      )}
                    </strong>
                  </div>
                </article>
              ),
            )}
          </section>


          {chartModel && (
            <>
              {chartModel.kind ===
              "sales" ? (
                <section className="reports-visual-grid">
                  <article className="reports-chart-panel reports-dynamic-chart">
                    <div className="reports-panel-heading">
                      <div>
                        <span>
                          INGRESOS
                        </span>

                        <h2>
                          Evolución de ingresos
                        </h2>

                        <p>
                          Facturación diaria dentro del periodo seleccionado.
                        </p>
                      </div>
                    </div>

                    <div className="reports-chart-box">
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <AreaChart
                          data={
                            chartModel.data
                          }
                          margin={{
                            top: 12,
                            right: 18,
                            left: 0,
                            bottom: 0,
                          }}
                        >
                          <defs>
                            <linearGradient
                              id="reportsDynamicRevenue"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#0ea5b7"
                                stopOpacity={0.28}
                              />

                              <stop
                                offset="95%"
                                stopColor="#0ea5b7"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>

                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={
                              false
                            }
                            stroke="#e8edf1"
                          />

                          <XAxis
                            dataKey="label"
                            tickLine={
                              false
                            }
                            axisLine={
                              false
                            }
                            fontSize={9}
                          />

                          <YAxis
                            tickLine={
                              false
                            }
                            axisLine={
                              false
                            }
                            width={55}
                            fontSize={9}
                            tickFormatter={(
                              value,
                            ) =>
                              formatCompactCurrency(
                                value,
                              )
                            }
                          />

                          <Tooltip />

                          <Area
                            type="monotone"
                            dataKey="revenue"
                            name="Ingresos"
                            stroke="#0e8194"
                            strokeWidth={2}
                            fill="url(#reportsDynamicRevenue)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </article>


                  <article className="reports-chart-panel reports-dynamic-chart">
                    <div className="reports-panel-heading">
                      <div>
                        <span>
                          OPERACIONES
                        </span>

                        <h2>
                          Ventas por día
                        </h2>

                        <p>
                          Cantidad de ventas completadas por fecha.
                        </p>
                      </div>
                    </div>

                    <div className="reports-chart-box">
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <BarChart
                          data={
                            chartModel.data
                          }
                          margin={{
                            top: 12,
                            right: 18,
                            left: 0,
                            bottom: 0,
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
                            dataKey="label"
                            tickLine={
                              false
                            }
                            axisLine={
                              false
                            }
                            fontSize={9}
                          />

                          <YAxis
                            tickLine={
                              false
                            }
                            axisLine={
                              false
                            }
                            allowDecimals={
                              false
                            }
                            fontSize={9}
                          />

                          <Tooltip />

                          <Bar
                            dataKey="sales"
                            name="Ventas"
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
                  </article>
                </section>
              ) : (
                <section className="reports-chart-panel reports-dynamic-chart reports-single-chart">
                  <div className="reports-panel-heading reports-dynamic-heading">
                    <div>
                      <span>
                        VISUALIZACIÓN
                      </span>

                      <h2>
                        {
                          chartModel.title
                        }
                      </h2>

                      <p>
                        {
                          chartModel.description
                        }
                      </p>
                    </div>
                  </div>

                  <div className="reports-chart-box reports-chart-box-wide">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      {chartModel.kind ===
                        "branches"
                      || chartModel.kind ===
                        "products"
                      || chartModel.kind ===
                        "customers" ? (
                        <BarChart
                          data={
                            chartModel.data
                          }
                          layout="vertical"
                          margin={{
                            top: 8,
                            right: 30,
                            left: 35,
                            bottom: 0,
                          }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            horizontal={
                              false
                            }
                            stroke="#e8edf1"
                          />

                          <XAxis
                            type="number"
                            tickLine={
                              false
                            }
                            axisLine={
                              false
                            }
                            fontSize={9}
                            tickFormatter={(
                              value,
                            ) =>
                              chartModel.currency
                                ? formatCompactCurrency(
                                    value,
                                  )
                                : formatNumber(
                                    value,
                                  )
                            }
                          />

                          <YAxis
                            type="category"
                            dataKey="label"
                            tickLine={
                              false
                            }
                            axisLine={
                              false
                            }
                            width={125}
                            fontSize={9}
                          />

                          <Tooltip />

                          <Bar
                            dataKey={
                              chartModel.primaryKey
                            }
                            name={
                              chartModel.primaryLabel
                            }
                            fill="#0ea5b7"
                            radius={[
                              0,
                              5,
                              5,
                              0,
                            ]}
                          />
                        </BarChart>
                      ) : (
                        <BarChart
                          data={
                            chartModel.data
                          }
                          margin={{
                            top: 10,
                            right: 25,
                            left: 0,
                            bottom: 0,
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
                            dataKey="label"
                            tickLine={
                              false
                            }
                            axisLine={
                              false
                            }
                            fontSize={9}
                          />

                          <YAxis
                            tickLine={
                              false
                            }
                            axisLine={
                              false
                            }
                            allowDecimals={
                              false
                            }
                            fontSize={9}
                          />

                          <Tooltip />

                          <Legend />

                          <Bar
                            dataKey={
                              chartModel.primaryKey
                            }
                            name={
                              chartModel.primaryLabel
                            }
                            fill="#0ea5b7"
                            radius={[
                              5,
                              5,
                              0,
                              0,
                            ]}
                          />

                          {chartModel.secondaryKey && (
                            <Bar
                              dataKey={
                                chartModel.secondaryKey
                              }
                              name={
                                chartModel.secondaryLabel
                              }
                              fill="#2563eb"
                              radius={[
                                5,
                                5,
                                0,
                                0,
                              ]}
                            />
                          )}
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </section>
              )}
            </>
          )}


          <section className="reports-preview-panel">
            <div className="reports-preview-header">
              <div>
                <span>
                  VISTA PREVIA
                </span>

                <h2>
                  {report.title}
                </h2>

                <p>
                  {report.description}
                </p>

                <small>
                  Sucursal:{" "}
                  {
                    report
                      .branch_name
                  }
                  {" · "}
                  {
                    report.rows
                      .length
                  }{" "}
                  registros mostrados
                </small>
              </div>

              <FileText
                size={21}
              />
            </div>


            {report.rows.length ===
            0 ? (
              <ModuleState
                type="empty"
                title="No hay información para este reporte"
                description="Cambia el periodo, sucursal o tipo de reporte."
              />
            ) : (
              <div className="reports-table-wrap">
                <table className="reports-table">
                  <thead>
                    <tr>
                      {report.columns.map(
                        (column) => (
                          <th
                            key={
                              column.key
                            }
                          >
                            {
                              column.label
                            }
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {report.rows.map(
                      (
                        row,
                        index,
                      ) => (
                        <tr
                          key={
                            index
                          }
                        >
                          {report.columns.map(
                            (
                              column,
                            ) => (
                              <td
                                key={
                                  column.key
                                }
                              >
                                {formatCell(
                                  column,
                                  row[
                                    column.key
                                  ],
                                )}
                              </td>
                            ),
                          )}
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}


      <section className="reports-files-panel reports-history-panel">
        <div className="reports-files-header">
          <div>
            <span>
              HISTORIAL
            </span>

            <h2>
              Reportes registrados
            </h2>

            <p className="reports-history-description">
              Reportes previamente almacenados en SalesIA.
            </p>
          </div>


          <div
            className="reports-search"
            data-export-hide="true"
          >
            <Search
              size={14}
            />

            <input
              type="search"
              value={
                reportSearch
              }
              onChange={(
                event,
              ) =>
                setReportSearch(
                  event.target.value,
                )
              }
              placeholder="Buscar reporte..."
            />
          </div>
        </div>


        {reportsLoading ? (
          <div className="reports-files-state">
            Cargando historial...
          </div>
        ) : reportsError ? (
          <div className="reports-files-state error">
            {reportsError}
          </div>
        ) : filteredReports.length ===
        0 ? (
          <div className="reports-files-state">
            Todavía no hay reportes registrados.
          </div>
        ) : (
          <div className="reports-table-wrap">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>
                    Reporte
                  </th>

                  <th>
                    Tipo
                  </th>

                  <th>
                    Estado
                  </th>

                  <th>
                    Fecha
                  </th>

                  <th data-export-hide="true">
                    Archivo
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredReports.map(
                  (item) => (
                    <tr
                      key={
                        item.id
                      }
                    >
                      <td>
                        <div className="reports-name">
                          <FileText
                            size={15}
                          />

                          <strong>
                            {
                              item.name
                            }
                          </strong>
                        </div>
                      </td>

                      <td>
                        {translateReportType(
                          item.report_type,
                        )}
                      </td>

                      <td>
                        <span
                          className={
                            statusClass(
                              item.status,
                            )
                          }
                        >
                          {translateStatus(
                            item.status,
                          )}
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          item.created_at,
                        )}
                      </td>

                      <td data-export-hide="true">
                        {item.file_url ? (
                          <a
                            className="reports-open-link"
                            href={
                              item.file_url
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink
                              size={13}
                            />

                            Abrir
                          </a>
                        ) : (
                          <span className="reports-no-file">
                            No disponible
                          </span>
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
