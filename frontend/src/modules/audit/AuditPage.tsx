import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Activity,
  AlertTriangle,
  Database,
  Eye,
  FileClock,
  LogIn,
  MapPin,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
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
import PeruAuditMap from "../../components/maps/PeruAuditMap";
import Modal from "../../components/ui/Modal";

import {
  useApiResource,
} from "../../hooks/useApiResource";

import {
  getAuditLogs,
} from "../../services/audit.service";

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
  AuditLogItem,
} from "../../types/audit";

import "./audit-commercial.css";


const PAGE_SIZE = 12;


function normalize(
  value:
    string
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


function formatShortDate(
  value: string,
) {
  const date =
    new Date(
      `${value}T00:00:00`,
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
      day: "2-digit",
      month: "short",
    },
  ).format(date);
}


function formatOnlyDate(
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
      dateStyle:
        "medium",

      timeZone:
        "America/Lima",
    },
  ).format(date);
}


function formatOnlyTime(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "es-PE",
    {
      hour:
        "2-digit",

      minute:
        "2-digit",

      second:
        "2-digit",

      timeZone:
        "America/Lima",
    },
  ).format(date);
}


function auditDataText(
  item: AuditLogItem,
  key: string,
) {
  const contextValue =
    item.new_data?.[
      "_audit_context"
    ];

  const context =
    (
      contextValue
      && typeof contextValue ===
        "object"
      && !Array.isArray(
        contextValue
      )
    )
      ? contextValue as
          Record<string, unknown>
      : null;

  const directValue =
    item.new_data?.[
      key
    ];

  const value =
    directValue
    ?? context?.[
      key
    ];

  if (
    value === null
    || value === undefined
  ) {
    return "";
  }

  if (
    typeof value ===
      "string"
    || typeof value ===
      "number"
  ) {
    return String(
      value,
    ).trim();
  }

  return "";
}


function auditLocation(
  item: AuditLogItem,
) {
  const city =
    auditDataText(
      item,
      "city",
    );

  const department =
    auditDataText(
      item,
      "department",
    );

  const country =
    auditDataText(
      item,
      "country",
    );


  const values =
    [
      city,
      department,
      country,
    ].filter(
      Boolean,
    );


  const unique =
    values.filter(
      (
        value,
        index,
      ) =>
        values.findIndex(
          (
            current,
          ) =>
            normalize(
              current,
            )
            ===
            normalize(
              value,
            ),
        )
        === index,
    );


  if (
    unique.length > 0
  ) {
    return unique.join(
      ", ",
    );
  }


  return "No disponible";
}



function auditCoordinates(
  item: AuditLogItem,
) {
  const rawLatitude = auditDataText(item, "lat").trim();
  const rawLongitude = auditDataText(item, "lng").trim();

  if (
    !rawLatitude ||
    !rawLongitude
  ) {
    return null;
  }

  const latitude = Number(rawLatitude);
  const longitude = Number(rawLongitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180 ||
    (latitude === 0 && longitude === 0)
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
}


function auditMapUrl(
  item: AuditLogItem,
) {
  const coordinates =
    auditCoordinates(
      item,
    );


  if (!coordinates) {
    return "";
  }


  const {
    latitude,
    longitude,
  } = coordinates;


  const delta =
    0.012;


  const left =
    longitude - delta;

  const bottom =
    latitude - delta;

  const right =
    longitude + delta;

  const top =
    latitude + delta;


  const bbox =
    [
      left,
      bottom,
      right,
      top,
    ].join(
      ",",
    );


  return (
    "https://www.openstreetmap.org/export/embed.html"
    + `?bbox=${encodeURIComponent(
        bbox,
      )}`
    + "&layer=mapnik"
    + `&marker=${encodeURIComponent(
        `${latitude},${longitude}`,
      )}`
  );
}


function auditDevice(
  item: AuditLogItem,
) {
  const userAgent =
    item.user_agent
    ?? "";

  if (!userAgent) {
    return "No disponible";
  }


  const normalized =
    userAgent.toLowerCase();


  let device =
    "Computadora";


  if (
    normalized.includes(
      "iphone",
    )
  ) {
    device =
      "iPhone";
  } else if (
    normalized.includes(
      "ipad",
    )
  ) {
    device =
      "iPad";
  } else if (
    normalized.includes(
      "android",
    )
  ) {
    device =
      normalized.includes(
        "mobile",
      )
        ? "Android"
        : "Tablet Android";
  } else if (
    normalized.includes(
      "windows",
    )
  ) {
    device =
      "PC Windows";
  } else if (
    normalized.includes(
      "macintosh",
    )
    || normalized.includes(
      "mac os",
    )
  ) {
    device =
      "Mac";
  } else if (
    normalized.includes(
      "linux",
    )
  ) {
    device =
      "PC Linux";
  }


  let browser =
    "Navegador";


  if (
    normalized.includes(
      "edg/",
    )
    || normalized.includes(
      "edge/",
    )
  ) {
    browser =
      "Microsoft Edge";
  } else if (
    normalized.includes(
      "opr/",
    )
    || normalized.includes(
      "opera",
    )
  ) {
    browser =
      "Opera";
  } else if (
    normalized.includes(
      "firefox/",
    )
  ) {
    browser =
      "Firefox";
  } else if (
    normalized.includes(
      "chrome/",
    )
    || normalized.includes(
      "crios/",
    )
  ) {
    browser =
      "Chrome";
  } else if (
    normalized.includes(
      "safari/",
    )
  ) {
    browser =
      "Safari";
  }


  return `${device} · ${browser}`;
}



function localDateKey(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value.slice(
      0,
      10,
    );
  }

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


function translateAction(
  value: string,
) {
  const normalized =
    normalize(value)
      .replace(
        /[_\s]+/g,
        ".",
      );

  const translations:
    Record<string, string> = {
      "user.login":
        "Inicio de sesión",

      "user.logout":
        "Cierre de sesión",

      "user.created":
        "Usuario creado",

      "user.updated":
        "Usuario actualizado",

      "user.activated":
        "Usuario activado",

      "user.deactivated":
        "Usuario desactivado",

      "sale.created":
        "Venta registrada",

      "sale.updated":
        "Venta actualizada",

      "sale.cancelled":
        "Venta anulada",

      "sale.canceled":
        "Venta anulada",

      "customer.created":
        "Cliente creado",

      "customer.updated":
        "Cliente actualizado",

      "customer.deactivated":
        "Cliente desactivado",

      "product.created":
        "Producto creado",

      "product.updated":
        "Producto actualizado",

      "product.deactivated":
        "Producto desactivado",

      "category.created":
        "Categoría creada",

      "category.updated":
        "Categoría actualizada",

      "category.deactivated":
        "Categoría desactivada",

      "inventory.entry":
        "Entrada de inventario",

      "inventory.exit":
        "Salida de inventario",

      "inventory.movement":
        "Movimiento de inventario",

      "branch.created":
        "Sucursal creada",

      "branch.updated":
        "Sucursal actualizada",

      "company.updated":
        "Empresa actualizada",

      "product.image_updated":
        "Imagen de producto actualizada",

      "inventory.adjustment":
        "Ajuste de inventario",
    };

  return (
    translations[
      normalized
    ]
    ?? value
      .replace(
        /[._-]+/g,
        " ",
      )
      .replace(
        /\b\w/g,
        (
          letter,
        ) =>
          letter.toUpperCase(),
      )
  );
}


function translateEntity(
  value:
    string
    | null,
) {
  if (!value) {
    return "Sistema";
  }

  const translations:
    Record<string, string> = {
      auth_sessions:
        "Sesiones",

      users:
        "Usuarios",

      sales:
        "Ventas",

      sale_details:
        "Detalle de venta",

      customers:
        "Clientes",

      products:
        "Productos",

      categories:
        "Categorías",

      inventory:
        "Inventario",

      inventory_movements:
        "Kardex",

      branches:
        "Sucursales",

      companies:
        "Empresa",

      insights:
        "Insights",

      reports:
        "Reportes",

      datasets:
        "Datos analíticos",

      statistical_analyses:
        "Análisis estadístico",

      bayes_analyses:
        "Probabilidad",

      random_variables:
        "Variables aleatorias",
    };

  const normalized =
    normalize(value);

  return (
    translations[
      normalized
    ]
    ?? value
      .replace(
        /_/g,
        " ",
      )
      .replace(
        /\b\w/g,
        (
          letter,
        ) =>
          letter.toUpperCase(),
      )
  );
}


function formatDataKey(
  value: string,
) {
  const translations:
    Record<string, string> = {
      status:
        "Estado",

      name:
        "Nombre",

      first_name:
        "Nombres",

      last_name:
        "Apellidos",

      email:
        "Correo",

      phone:
        "Teléfono",

      role:
        "Rol",

      role_id:
        "Rol",

      total:
        "Total",

      subtotal:
        "Subtotal",

      discount:
        "Descuento",

      tax:
        "Impuesto",

      stock_quantity:
        "Stock",

      minimum_stock:
        "Stock mínimo",

      maximum_stock:
        "Stock máximo",

      sale_number:
        "Número de venta",

      product_id:
        "Producto",

      customer_id:
        "Cliente",

      branch_id:
        "Sucursal",
    };

  return (
    translations[
      value
    ]
    ?? value
      .replace(
        /_/g,
        " ",
      )
      .replace(
        /\b\w/g,
        (
          letter,
        ) =>
          letter.toUpperCase(),
      )
  );
}


function formatDataValue(
  value: unknown,
) {
  if (
    value === null
    || value === undefined
  ) {
    return "—";
  }

  if (
    typeof value ===
    "boolean"
  ) {
    return value
      ? "Sí"
      : "No";
  }

  if (
    typeof value ===
    "number"
  ) {
    return new Intl.NumberFormat(
      "es-PE",
      {
        maximumFractionDigits:
          4,
      },
    ).format(value);
  }

  if (
    typeof value ===
    "object"
  ) {
    try {
      return JSON.stringify(
        value,
      );
    } catch {
      return String(
        value,
      );
    }
  }

  const text =
    String(value);

  const translations:
    Record<string, string> = {
      active:
        "Activo",

      inactive:
        "Inactivo",

      cancelled:
        "Anulado",

      canceled:
        "Anulado",

      completed:
        "Completado",

      pending:
        "Pendiente",
    };

  return (
    translations[
      normalize(text)
    ]
    ?? text
  );
}


function dataToText(
  data:
    Record<string, unknown>
    | null,
) {
  if (!data) {
    return "";
  }

  return Object.entries(
    data,
  )
    .map(
      (
        [
          key,
          value,
        ],
      ) =>
        `${formatDataKey(
          key,
        )}: ${formatDataValue(
          value,
        )}`,
    )
    .join("; ");
}


function actionLevel(
  action: string,
) {
  const value =
    normalize(action);

  if (
    value.includes(
      "cancel",
    )
    || value.includes(
      "delete",
    )
    || value.includes(
      "deactiv",
    )
  ) {
    return {
      label:
        "Alta",

      className:
        "high",
    };
  }

  if (
    value.includes(
      "updated",
    )
    || value.includes(
      "exit",
    )
  ) {
    return {
      label:
        "Media",

      className:
        "medium",
    };
  }

  return {
    label:
      "Informativa",

    className:
      "info",
  };
}


function actionClass(
  action: string,
) {
  const value =
    normalize(action);

  if (
    value.includes(
      "cancel",
    )
    || value.includes(
      "delete",
    )
    || value.includes(
      "deactiv",
    )
  ) {
    return "audit-action danger";
  }

  if (
    value.includes(
      "created",
    )
    || value.includes(
      "login",
    )
    || value.includes(
      "entry",
    )
  ) {
    return "audit-action success";
  }

  if (
    value.includes(
      "updated",
    )
  ) {
    return "audit-action info";
  }

  return "audit-action";
}


function AuditPage() {
  const exportRef =
    useRef<HTMLElement>(
      null,
    );

  const {
    data,
    setData,
    loading,
    error,
    reload,
  } =
    useApiResource<
      AuditLogItem[]
    >(
      getAuditLogs,
    );


  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    actionFilter,
    setActionFilter,
  ] =
    useState("all");

  const [
    entityFilter,
    setEntityFilter,
  ] =
    useState("all");

  const [
    dateFrom,
    setDateFrom,
  ] =
    useState("");

  const [
    dateTo,
    setDateTo,
  ] =
    useState("");

  const [
    page,
    setPage,
  ] =
    useState(1);

  const [
    selected,
    setSelected,
  ] =
    useState<
      AuditLogItem | null
    >(null);

  const [
    exportError,
    setExportError,
  ] =
    useState("");


  const [
    lastSyncAt,
    setLastSyncAt,
  ] =
    useState<Date | null>(
      null,
    );


  const [
    liveSyncError,
    setLiveSyncError,
  ] =
    useState("");


  const logs =
    data ?? [];


  useEffect(
    () => {
      let mounted =
        true;


      async function syncAudit() {
        try {
          const freshLogs =
            await getAuditLogs();

          if (!mounted) {
            return;
          }

          setData(
            freshLogs,
          );

          setLastSyncAt(
            new Date(),
          );

          setLiveSyncError(
            "",
          );
        } catch {
          if (!mounted) {
            return;
          }

          setLiveSyncError(
            "No se pudo actualizar en tiempo real.",
          );
        }
      }


      const intervalId =
        window.setInterval(
          () => {
            void syncAudit();
          },
          5000,
        );


      function handleVisibility() {
        if (
          document.visibilityState ===
          "visible"
        ) {
          void syncAudit();
        }
      }


      document.addEventListener(
        "visibilitychange",
        handleVisibility,
      );


      void syncAudit();


      return () => {
        mounted =
          false;

        window.clearInterval(
          intervalId,
        );

        document.removeEventListener(
          "visibilitychange",
          handleVisibility,
        );
      };
    },
    [
      setData,
    ],
  );


  const actionOptions =
    useMemo(
      () =>
        Array.from(
          new Set(
            logs.map(
              (
                item,
              ) =>
                item.action,
            ),
          ),
        ).sort(
          (
            left,
            right,
          ) =>
            translateAction(
              left,
            ).localeCompare(
              translateAction(
                right,
              ),
              "es",
            ),
        ),
      [
        logs,
      ],
    );


  const entityOptions =
    useMemo(
      () =>
        Array.from(
          new Set(
            logs
              .map(
                (
                  item,
                ) =>
                  item.table_name,
              )
              .filter(
                (
                  value,
                ): value is string =>
                  Boolean(
                    value,
                  ),
              ),
          ),
        ).sort(
          (
            left,
            right,
          ) =>
            translateEntity(
              left,
            ).localeCompare(
              translateEntity(
                right,
              ),
              "es",
            ),
        ),
      [
        logs,
      ],
    );


  const filteredLogs =
    useMemo(
      () => {
        const query =
          normalize(
            search,
          );

        return logs.filter(
          (
            item,
          ) => {
            const searchable =
              [
                item.user_name,
                item.user_role,
                item.action,
                translateAction(
                  item.action,
                ),
                item.table_name,
                translateEntity(
                  item.table_name,
                ),
                item.record_id,
                item.ip_address,
              ]
                .map(
                  (
                    value,
                  ) =>
                    normalize(
                      value,
                    ),
                )
                .join(" ");


            const matchesSearch =
              !query
              || searchable.includes(
                query,
              );


            const matchesAction =
              actionFilter ===
                "all"
              || item.action ===
                actionFilter;


            const matchesEntity =
              entityFilter ===
                "all"
              || item.table_name ===
                entityFilter;


            const createdAt =
              new Date(
                item.created_at,
              );


            let matchesFrom =
              true;

            let matchesTo =
              true;


            if (
              dateFrom
              && !Number.isNaN(
                createdAt.getTime(),
              )
            ) {
              matchesFrom =
                createdAt >=
                new Date(
                  `${dateFrom}T00:00:00`,
                );
            }


            if (
              dateTo
              && !Number.isNaN(
                createdAt.getTime(),
              )
            ) {
              matchesTo =
                createdAt <=
                new Date(
                  `${dateTo}T23:59:59.999`,
                );
            }


            return (
              matchesSearch
              && matchesAction
              && matchesEntity
              && matchesFrom
              && matchesTo
            );
          },
        );
      },
      [
        logs,
        search,
        actionFilter,
        entityFilter,
        dateFrom,
        dateTo,
      ],
    );


  const summary =
    useMemo(
      () => {
        const users =
          new Set(
            filteredLogs
              .map(
                (
                  item,
                ) =>
                  item.user_name,
              )
              .filter(Boolean),
          );


        const logins =
          filteredLogs.filter(
            (
              item,
            ) =>
              normalize(
                item.action,
              ) ===
                "user.login",
          ).length;


        const sensitive =
          filteredLogs.filter(
            (
              item,
            ) =>
              actionLevel(
                item.action,
              ).className ===
                "high",
          ).length;


        const latest =
          filteredLogs.reduce<
            AuditLogItem | null
          >(
            (
              current,
              item,
            ) => {
              if (!current) {
                return item;
              }

              return (
                new Date(
                  item.created_at,
                ).getTime()
                >
                new Date(
                  current.created_at,
                ).getTime()
              )
                ? item
                : current;
            },
            null,
          );


        return {
          users:
            users.size,

          logins,
          sensitive,
          latest,
        };
      },
      [
        filteredLogs,
      ],
    );


  const activityData =
    useMemo(
      () => {
        const days =
          new Map<
            string,
            {
              events: number;
              sensitive: number;
            }
          >();


        filteredLogs.forEach(
          (
            item,
          ) => {
            const key =
              localDateKey(
                item.created_at,
              );

            const current =
              days.get(
                key,
              )
              ?? {
                events: 0,
                sensitive: 0,
              };

            current.events += 1;

            if (
              actionLevel(
                item.action,
              ).className ===
              "high"
            ) {
              current.sensitive +=
                1;
            }

            days.set(
              key,
              current,
            );
          },
        );


        return Array.from(
          days.entries(),
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
          .slice(-14)
          .map(
            (
              [
                date,
                values,
              ],
            ) => ({
              date:
                formatShortDate(
                  date,
                ),

              events:
                values.events,

              sensitive:
                values.sensitive,
            }),
          );
      },
      [
        filteredLogs,
      ],
    );


  const moduleData =
    useMemo(
      () => {
        const modules =
          new Map<
            string,
            number
          >();


        filteredLogs.forEach(
          (
            item,
          ) => {
            const label =
              translateEntity(
                item.table_name,
              );

            modules.set(
              label,
              (
                modules.get(
                  label,
                )
                ?? 0
              ) + 1,
            );
          },
        );


        return Array.from(
          modules.entries(),
        )
          .map(
            (
              [
                module,
                events,
              ],
            ) => ({
              module,
              events,
            }),
          )
          .sort(
            (
              left,
              right,
            ) =>
              right.events
              - left.events,
          )
          .slice(
            0,
            7,
          );
      },
      [
        filteredLogs,
      ],
    );


  const topActions =
    useMemo(
      () => {
        const actions =
          new Map<
            string,
            number
          >();


        filteredLogs.forEach(
          (
            item,
          ) => {
            actions.set(
              item.action,
              (
                actions.get(
                  item.action,
                )
                ?? 0
              ) + 1,
            );
          },
        );


        return Array.from(
          actions.entries(),
        )
          .map(
            (
              [
                action,
                total,
              ],
            ) => ({
              action,
              total,
            }),
          )
          .sort(
            (
              left,
              right,
            ) =>
              right.total
              - left.total,
          )
          .slice(
            0,
            5,
          );
      },
      [
        filteredLogs,
      ],
    );


  const latestLocatedLogin =
    useMemo(
      () =>
        filteredLogs.find(
          (
            item,
          ) =>
            normalize(
              item.action,
            ) ===
              "user.login"
            && Boolean(
              auditCoordinates(
                item,
              ),
            ),
        )
        ?? null,
      [
        filteredLogs,
      ],
    );


  const pageCount =
    Math.max(
      1,
      Math.ceil(
        filteredLogs.length
        / PAGE_SIZE,
      ),
    );


  const currentPage =
    Math.min(
      page,
      pageCount,
    );


  const paginatedLogs =
    filteredLogs.slice(
      (
        currentPage - 1
      )
      * PAGE_SIZE,

      currentPage
      * PAGE_SIZE,
    );


  function resetPage() {
    setPage(1);
  }


  function clearFilters() {
    setSearch("");
    setActionFilter(
      "all",
    );
    setEntityFilter(
      "all",
    );
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }


  function exportRows():
    ExportRow[] {
    return filteredLogs.map(
      (
        item,
      ) => ({
        Fecha:
          formatOnlyDate(
            item.created_at,
          ),

        Hora:
          formatOnlyTime(
            item.created_at,
          ),

        Usuario:
          item.user_name
          || "Sistema",

        Rol:
          item.user_role
          ?? "Sistema",

        Acción:
          translateAction(
            item.action,
          ),

        Módulo:
          translateEntity(
            item.table_name,
          ),

        "Nivel de atención":
          actionLevel(
            item.action,
          ).label,

        "ID del registro":
          item.record_id
          ?? "",

        Dirección:
          auditLocation(
            item,
          ),

        Dispositivo:
          auditDevice(
            item,
          ),

        "Datos anteriores":
          dataToText(
            item.old_data,
          ),

        "Datos nuevos":
          dataToText(
            item.new_data,
          ),

        Navegador:
          item.user_agent
          ?? "",
      }),
    );
  }


  function exportFilename() {
    return (
      `auditoria-${exportDateStamp()}`
    );
  }


  async function handlePdf() {
    if (
      !exportRef.current
      || filteredLogs.length ===
        0
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
    if (
      filteredLogs.length ===
      0
    ) {
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
    if (
      filteredLogs.length ===
      0
    ) {
      return;
    }

    setExportError("");

    try {
      await exportRowsToExcel(
        exportFilename(),
        "Auditoría",
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
      || filteredLogs.length ===
        0
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
        "Auditoría - SalesIA Enterprise",
        "Registro de actividad y trazabilidad de SalesIA Enterprise.",
      );
    } catch (
      currentError
    ) {
      setExportError(
        currentError
          instanceof Error
          ? currentError.message
          : "No se pudo compartir la auditoría.",
      );
    }
  }


  async function handleReload() {
    setExportError("");

    await reload();

    setLastSyncAt(
      new Date(),
    );
  }


  const oldEntries =
    selected?.old_data
      ? Object.entries(
          selected.old_data,
        ).filter(
          ([key]) =>
            !key.startsWith(
              "_audit_"
            ),
        )
      : [];


  const newEntries =
    selected?.new_data
      ? Object.entries(
          selected.new_data,
        ).filter(
          ([key]) =>
            !key.startsWith(
              "_audit_"
            ),
        )
      : [];


  return (
    <>
      <section
        ref={exportRef}
        className="audit-page"
      >
        <header className="audit-header">
          <div>
            <div className="audit-eyebrow">
              <ShieldCheck
                size={14}
              />

              CONTROL Y TRAZABILIDAD
            </div>

            <h1>
              Auditoría
            </h1>

            <p>
              Supervisa accesos, operaciones
              y cambios realizados dentro
              de SalesIA Enterprise.
            </p>
          </div>


          <div
            className="audit-header-actions"
            data-export-hide="true"
          >
            <ExportActions
              disabled={
                loading
                || filteredLogs.length ===
                  0
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
              className="audit-refresh-button"
              disabled={
                loading
              }
              onClick={() => {
                void handleReload();
              }}
            >
              <RefreshCw
                size={15}
              />

              Actualizar
            </button>
          </div>
        </header>


        {exportError && (
          <div
            className="audit-export-error"
            data-export-hide="true"
          >
            {exportError}
          </div>
        )}


        {!loading
        && !error
        && (
          <section className="audit-kpi-grid">
            <article>
              <div className="audit-kpi-icon">
                <Activity
                  size={17}
                />
              </div>

              <div>
                <span>
                  Eventos registrados
                </span>

                <strong>
                  {filteredLogs.length}
                </strong>

                <small>
                  de {logs.length} disponibles
                </small>
              </div>
            </article>


            <article>
              <div className="audit-kpi-icon">
                <Users
                  size={17}
                />
              </div>

              <div>
                <span>
                  Usuarios activos
                </span>

                <strong>
                  {summary.users}
                </strong>

                <small>
                  usuarios con actividad
                </small>
              </div>
            </article>


            <article>
              <div className="audit-kpi-icon">
                <LogIn
                  size={17}
                />
              </div>

              <div>
                <span>
                  Inicios de sesión
                </span>

                <strong>
                  {summary.logins}
                </strong>

                <small>
                  accesos registrados
                </small>
              </div>
            </article>


            <article>
              <div className="audit-kpi-icon warning">
                <AlertTriangle
                  size={17}
                />
              </div>

              <div>
                <span>
                  Eventos sensibles
                </span>

                <strong>
                  {summary.sensitive}
                </strong>

                <small>
                  anulaciones o desactivaciones
                </small>
              </div>
            </article>
          </section>
        )}


        {!loading
        && !error
        && filteredLogs.length > 0
        && (
          <section className="audit-dashboard-grid">
            <article className="audit-chart-panel audit-activity-panel">
              <header className="audit-card-heading">
                <div>
                  <span>
                    ACTIVIDAD
                  </span>

                  <h2>
                    Eventos por día
                  </h2>

                  <p>
                    Comportamiento de los últimos
                    días dentro del periodo filtrado.
                  </p>
                </div>

                <Activity
                  size={18}
                />
              </header>

              <div className="audit-chart">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <AreaChart
                    data={
                      activityData
                    }
                    margin={{
                      top: 10,
                      right: 16,
                      left: -20,
                      bottom: 0,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="auditEvents"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#0ea5b7"
                          stopOpacity={0.26}
                        />

                        <stop
                          offset="95%"
                          stopColor="#0ea5b7"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      vertical={
                        false
                      }
                      stroke="#edf2f5"
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="date"
                      tickLine={
                        false
                      }
                      axisLine={
                        false
                      }
                      fontSize={9}
                    />

                    <YAxis
                      allowDecimals={
                        false
                      }
                      tickLine={
                        false
                      }
                      axisLine={
                        false
                      }
                      fontSize={9}
                    />

                    <Tooltip />

                    <Legend />

                    <Area
                      type="monotone"
                      dataKey="events"
                      name="Eventos"
                      stroke="#0ea5b7"
                      strokeWidth={2}
                      fill="url(#auditEvents)"
                    />

                    <Area
                      type="monotone"
                      dataKey="sensitive"
                      name="Sensibles"
                      stroke="#dc2626"
                      strokeWidth={2}
                      fillOpacity={0}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </article>


            <article className="audit-chart-panel">
              <header className="audit-card-heading">
                <div>
                  <span>
                    MÓDULOS
                  </span>

                  <h2>
                    Actividad por módulo
                  </h2>

                  <p>
                    Áreas con mayor cantidad
                    de eventos registrados.
                  </p>
                </div>

                <Database
                  size={18}
                />
              </header>

              <div className="audit-chart">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart
                    data={
                      moduleData
                    }
                    layout="vertical"
                    margin={{
                      top: 8,
                      right: 20,
                      left: 20,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid
                      horizontal={
                        false
                      }
                      stroke="#edf2f5"
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      type="number"
                      allowDecimals={
                        false
                      }
                      tickLine={
                        false
                      }
                      axisLine={
                        false
                      }
                      fontSize={9}
                    />

                    <YAxis
                      type="category"
                      dataKey="module"
                      width={82}
                      tickLine={
                        false
                      }
                      axisLine={
                        false
                      }
                      fontSize={9}
                    />

                    <Tooltip />

                    <Bar
                      dataKey="events"
                      name="Eventos"
                      fill="#2563eb"
                      radius={[
                        0,
                        5,
                        5,
                        0,
                      ]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>


            <aside className="audit-summary-panel">
              <header className="audit-card-heading">
                <div>
                  <span>
                    RESUMEN
                  </span>

                  <h2>
                    Acciones frecuentes
                  </h2>
                </div>

                <FileClock
                  size={18}
                />
              </header>


              <div className="audit-action-ranking">
                {topActions.map(
                  (
                    item,
                    index,
                  ) => (
                    <div
                      key={
                        item.action
                      }
                    >
                      <span className="audit-rank">
                        {index + 1}
                      </span>

                      <div>
                        <strong>
                          {translateAction(
                            item.action,
                          )}
                        </strong>

                        <small>
                          {item.total}
                          {" "}
                          evento
                          {item.total ===
                          1
                            ? ""
                            : "s"}
                        </small>
                      </div>
                    </div>
                  ),
                )}
              </div>


              <div className="audit-latest">
                <span>
                  ÚLTIMA ACTIVIDAD
                </span>

                <strong>
                  {summary.latest
                    ? translateAction(
                        summary.latest.action,
                      )
                    : "Sin actividad"}
                </strong>

                <small>
                  {summary.latest
                    ? formatDate(
                        summary.latest.created_at,
                      )
                    : "—"}
                </small>
              </div>
            </aside>
          </section>
        )}


        <section className="audit-location-map-panel">



          {true ? (
            <div className="audit-map-layout">
              <div className="audit-map-frame">
                <PeruAuditMap
  branches={filteredLogs
    .filter(
      (item) => auditDataText(item, "location_source") === "ip" && Boolean(item.new_data?._audit_context)
    )
    .flatMap((item) => {
      const point = auditCoordinates(item);

      if (!point) return [];

      // Mostrar únicamente coordenadas dentro
      // del entorno geográfico del Perú.
      if (
        point.latitude < -19 ||
        point.latitude > 1.5 ||
        point.longitude < -82 ||
        point.longitude > -68
      ) {
        return [];
      }

      return [{
        id: item.id,
        company_id: item.company_id ?? "",
        code: item.action,
        name: item.user_name || "Usuario",
        address: item.user_agent,
        city: auditDataText(item, "city") || null,
        department: auditDataText(item, "department") || null,
        province: null,
        district: null,
        latitude: point.latitude,
        longitude: point.longitude,
        country: auditDataText(item, "country") || null,
        phone: null,
        email: null,
        status: "active",
        created_at: item.created_at,
        updated_at: item.created_at,
      }];
    })}
/>
              </div>

              {latestLocatedLogin && <aside className="audit-map-info">
                <span>
                  ÚLTIMA CONEXIÓN
                </span>

                <strong>
                  {latestLocatedLogin?.user_name
                    || "Sistema"}
                </strong>

                <p>
                  {auditLocation(
                    latestLocatedLogin,
                  )}
                </p>

                <dl>
                  <div>
                    <dt>
                      Fecha
                    </dt>

                    <dd>
                      {formatOnlyDate(
                        latestLocatedLogin.created_at,
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Hora
                    </dt>

                    <dd>
                      {formatOnlyTime(
                        latestLocatedLogin.created_at,
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Dispositivo
                    </dt>

                    <dd>
                      {auditDevice(
                        latestLocatedLogin,
                      )}
                    </dd>
                  </div>
                </dl>

                <small>
                  La ubicación mostrada es
                  aproximada y corresponde
                  únicamente a los datos
                  registrados por el evento.
                </small>
              </aside>}
            </div>
          ) : (
            <div className="audit-map-empty">
              <MapPin
                size={24}
              />

              <strong>
                Ubicación no disponible
              </strong>

              <p>
                Los eventos actuales no contienen
                coordenadas válidas. En localhost
                esto puede ocurrir porque el servidor
                no recibe una IP pública geolocalizable.
              </p>
            </div>
          )}
        </section>


        <section className="audit-panel">
          <div
            className="audit-toolbar"
            data-export-hide="true"
          >
            <div className="audit-search">
              <Search
                size={15}
              />

              <input
                type="search"
                value={
                  search
                }
                onChange={(
                  event,
                ) => {
                  setSearch(
                    event.target.value,
                  );

                  resetPage();
                }}
                placeholder="Buscar usuario, acción, módulo, IP o registro..."
              />
            </div>


            <select
              value={
                actionFilter
              }
              onChange={(
                event,
              ) => {
                setActionFilter(
                  event.target.value,
                );

                resetPage();
              }}
            >
              <option value="all">
                Todas las acciones
              </option>

              {actionOptions.map(
                (
                  action,
                ) => (
                  <option
                    key={
                      action
                    }
                    value={
                      action
                    }
                  >
                    {translateAction(
                      action,
                    )}
                  </option>
                ),
              )}
            </select>


            <select
              value={
                entityFilter
              }
              onChange={(
                event,
              ) => {
                setEntityFilter(
                  event.target.value,
                );

                resetPage();
              }}
            >
              <option value="all">
                Todos los módulos
              </option>

              {entityOptions.map(
                (
                  entity,
                ) => (
                  <option
                    key={
                      entity
                    }
                    value={
                      entity
                    }
                  >
                    {translateEntity(
                      entity,
                    )}
                  </option>
                ),
              )}
            </select>


            <input
              type="date"
              value={
                dateFrom
              }
              onChange={(
                event,
              ) => {
                setDateFrom(
                  event.target.value,
                );

                resetPage();
              }}
              aria-label="Fecha inicial"
            />


            <input
              type="date"
              value={
                dateTo
              }
              onChange={(
                event,
              ) => {
                setDateTo(
                  event.target.value,
                );

                resetPage();
              }}
              aria-label="Fecha final"
            />


            <button
              type="button"
              className="audit-clear-button"
              onClick={
                clearFilters
              }
            >
              <RotateCcw
                size={14}
              />

              Limpiar
            </button>
          </div>


          <div className="audit-panel-heading">
            <div>
              <FileClock
                size={18}
              />

              <div>
                <strong>
                  Registro de actividad
                </strong>

                <span>
                  {filteredLogs.length}
                  {" "}
                  evento
                  {filteredLogs.length ===
                  1
                    ? ""
                    : "s"}
                  {" "}
                  encontrados
                </span>
              </div>
            </div>

            <div
              className={
                liveSyncError
                  ? "audit-live-status error"
                  : "audit-live-status"
              }
              title={
                liveSyncError
                  || "La auditoría consulta nuevos eventos cada 5 segundos."
              }
            >
              <i />

              <div>
                <strong>
                  {liveSyncError
                    ? "Sin conexión"
                    : "En vivo"}
                </strong>

                <span>
                  {liveSyncError
                    ? liveSyncError
                    : (
                      lastSyncAt
                        ? `Actualizado ${new Intl.DateTimeFormat(
                            "es-PE",
                            {
                              hour:
                                "2-digit",

                              minute:
                                "2-digit",

                              second:
                                "2-digit",

                              timeZone:
                                "America/Lima",
                            },
                          ).format(
                            lastSyncAt,
                          )}`
                        : "Sincronizando..."
                    )}
                </span>
              </div>
            </div>
          </div>


          {loading ? (
            <div className="audit-state">
              <div className="audit-spinner" />

              <strong>
                Cargando auditoría
              </strong>

              <p>
                Consultando registros del sistema.
              </p>
            </div>
          ) : error ? (
            <div
              className="audit-state error"
              role="alert"
            >
              <AlertTriangle
                size={22}
              />

              <strong>
                No se pudo cargar la auditoría
              </strong>

              <p>
                {error}
              </p>
            </div>
          ) : filteredLogs.length ===
            0 ? (
            <div className="audit-state">
              <ShieldCheck
                size={28}
              />

              <strong>
                Sin registros
              </strong>

              <p>
                No existen eventos que
                coincidan con los filtros.
              </p>
            </div>
          ) : (
            <>
              <div className="audit-table-wrap">
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th>
                        Fecha
                      </th>

                      <th>
                        Hora
                      </th>

                      <th>
                        Usuario
                      </th>

                      <th>
                        Acción
                      </th>

                      <th>
                        Módulo
                      </th>

                      <th>
                        Atención
                      </th>

                      <th>
                        Dirección / ubicación
                      </th>

                      <th>
                        Dispositivo
                      </th>

                      <th
                        data-export-hide="true"
                      >
                        Detalle
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedLogs.map(
                      (
                        item,
                      ) => {
                        const level =
                          actionLevel(
                            item.action,
                          );

                        return (
                          <tr
                            key={
                              item.id
                            }
                          >
                            <td>
                              <span className="audit-date">
                                {formatOnlyDate(
                                  item.created_at,
                                )}
                              </span>
                            </td>

                            <td>
                              <span className="audit-time">
                                {formatOnlyTime(
                                  item.created_at,
                                )}
                              </span>
                            </td>

                            <td>
                              <div className="audit-user">
                                <strong>
                                  {item.user_name
                                    || "Sistema"}
                                </strong>

                                <span>
                                  {item.user_role
                                    ?? "Sistema"}
                                </span>
                              </div>
                            </td>

                            <td>
                              <span
                                className={
                                  actionClass(
                                    item.action,
                                  )
                                }
                              >
                                {translateAction(
                                  item.action,
                                )}
                              </span>
                            </td>

                            <td>
                              {translateEntity(
                                item.table_name,
                              )}
                            </td>

                            <td>
                              <span
                                className={
                                  `audit-level ${level.className}`
                                }
                              >
                                {level.label}
                              </span>
                            </td>

                            <td>
                              <div className="audit-location">
                                <strong>
                                  {auditLocation(
                                    item,
                                  )}
                                </strong>

                                {item.action ===
                                  "user.login" && (
                                  <span>
                                    Ubicación aproximada
                                  </span>
                                )}
                              </div>
                            </td>

                            <td>
                              <span className="audit-device">
                                {auditDevice(
                                  item,
                                )}
                              </span>
                            </td>

                            <td
                              data-export-hide="true"
                            >
                              <button
                                type="button"
                                className="audit-detail-button"
                                onClick={() =>
                                  setSelected(
                                    item,
                                  )
                                }
                              >
                                <Eye
                                  size={14}
                                />

                                Ver
                              </button>
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>


              <div
                className="audit-pagination"
                data-export-hide="true"
              >
                <span>
                  Mostrando
                  {" "}
                  {(
                    currentPage - 1
                  )
                  * PAGE_SIZE
                  + 1}
                  {" "}
                  a
                  {" "}
                  {Math.min(
                    currentPage
                    * PAGE_SIZE,
                    filteredLogs.length,
                  )}
                  {" "}
                  de
                  {" "}
                  {filteredLogs.length}
                </span>

                <div>
                  <button
                    type="button"
                    disabled={
                      currentPage <=
                      1
                    }
                    onClick={() =>
                      setPage(
                        (
                          current,
                        ) =>
                          Math.max(
                            1,
                            current - 1,
                          ),
                      )
                    }
                  >
                    Anterior
                  </button>

                  <strong>
                    {currentPage}
                    {" / "}
                    {pageCount}
                  </strong>

                  <button
                    type="button"
                    disabled={
                      currentPage >=
                      pageCount
                    }
                    onClick={() =>
                      setPage(
                        (
                          current,
                        ) =>
                          Math.min(
                            pageCount,
                            current + 1,
                          ),
                      )
                    }
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </section>


      <Modal
        open={
          Boolean(
            selected,
          )
        }
        title="Detalle de auditoría"
        description={
          selected
            ? `${translateAction(
                selected.action,
              )} · ${formatDate(
                selected.created_at,
              )}`
            : ""
        }
        onClose={() =>
          setSelected(
            null,
          )
        }
      >
        {selected && (
          <div className="audit-detail">
            <div className="audit-detail-grid">
              <div>
                <span>
                  Usuario
                </span>

                <strong>
                  {selected.user_name
                    || "Sistema"}
                </strong>
              </div>

              <div>
                <span>
                  Rol
                </span>

                <strong>
                  {selected.user_role
                    ?? "Sistema"}
                </strong>
              </div>

              <div>
                <span>
                  Acción
                </span>

                <strong>
                  {translateAction(
                    selected.action,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Módulo
                </span>

                <strong>
                  {translateEntity(
                    selected.table_name,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Dirección / ubicación
                </span>

                <strong>
                  {auditLocation(
                    selected,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Hora
                </span>

                <strong>
                  {formatOnlyTime(
                    selected.created_at,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Dispositivo
                </span>

                <strong>
                  {auditDevice(
                    selected,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Nivel de atención
                </span>

                <strong>
                  {actionLevel(
                    selected.action,
                  ).label}
                </strong>
              </div>
            </div>


            <div className="audit-record-box">
              <span>
                ID del registro afectado
              </span>

              <strong>
                {selected.record_id
                  ?? "No aplica"}
              </strong>
            </div>


            {auditCoordinates(
              selected,
            ) ? (
              <section className="audit-detail-map">
                <div className="audit-detail-map-heading">
                  <div>
                    <span>
                      UBICACIÓN DE LA CONEXIÓN
                    </span>

                    <strong>
                      {auditLocation(
                        selected,
                      )}
                    </strong>
                  </div>

                  <MapPin
                    size={18}
                  />
                </div>

                <div className="audit-detail-map-frame">
                  <iframe
                    title="Ubicación de la conexión"
                    src={
                      auditMapUrl(
                        selected,
                      )
                    }
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </section>
            ) : (
              <section className="audit-detail-map unavailable">
                <MapPin
                  size={18}
                />

                <div>
                  <strong>
                    Ubicación no disponible
                  </strong>

                  <span>
                    Este evento no contiene
                    coordenadas registradas.
                  </span>
                </div>
              </section>
            )}


            <div className="audit-change-grid">
              <section className="audit-change-section before">
                <h3>
                  Datos anteriores
                </h3>

                {oldEntries.length ===
                0 ? (
                  <p className="audit-no-data">
                    No se registraron datos
                    anteriores.
                  </p>
                ) : (
                  <div className="audit-change-list">
                    {oldEntries.map(
                      (
                        [
                          key,
                          value,
                        ],
                      ) => (
                        <div
                          key={
                            key
                          }
                        >
                          <span>
                            {formatDataKey(
                              key,
                            )}
                          </span>

                          <strong>
                            {formatDataValue(
                              value,
                            )}
                          </strong>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </section>


              <section className="audit-change-section after">
                <h3>
                  Datos nuevos
                </h3>

                {newEntries.length ===
                0 ? (
                  <p className="audit-no-data">
                    No se registraron datos
                    nuevos.
                  </p>
                ) : (
                  <div className="audit-change-list">
                    {newEntries.map(
                      (
                        [
                          key,
                          value,
                        ],
                      ) => (
                        <div
                          key={
                            key
                          }
                        >
                          <span>
                            {formatDataKey(
                              key,
                            )}
                          </span>

                          <strong>
                            {formatDataValue(
                              value,
                            )}
                          </strong>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </section>
            </div>


            {selected.user_agent && (
              <section className="audit-browser">
                <span>
                  Información del dispositivo
                </span>

                <strong>
                  {auditDevice(
                    selected,
                  )}
                </strong>

                <p>
                  Identificado a partir de la
                  información técnica registrada
                  durante el acceso.
                </p>
              </section>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}


export default AuditPage;
