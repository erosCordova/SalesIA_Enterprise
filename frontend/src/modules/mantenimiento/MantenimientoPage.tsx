import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  ComponentType,
} from "react";

import {
  Building2,
  CircleCheckBig,
  CircleOff,
  Database,
  MapPin,
  PackageSearch,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Tags,
  UserRoundCog,
  UsersRound,
} from "lucide-react";

import type {
  LucideIcon,
} from "lucide-react";

import ClientesPage from "../clientes/ClientesPage";
import ProductosPage from "../productos/ProductosPage";
import CategoriasPage from "../categorias/CategoriasPage";
import EmpresaPage from "../empresa/EmpresaPage";
import SucursalesPage from "../sucursales/SucursalesPage";
import AccessPage from "../auth/AccessPage";

import {
  getCategories,
  getCustomers,
  getProducts,
} from "../../services/commercial.service";

import {
  getBranches,
  getCompany,
} from "../../services/organization.service";

import {
  getRoles,
  getUsers,
} from "../../services/users.service";

import {
  useAuth,
} from "../../services/auth.context";

import type {
  UserRole,
} from "../../types/auth";

import "./mantenimiento.css";


type CatalogKey =
  | "clientes"
  | "productos"
  | "categorias"
  | "empresa"
  | "sucursales"
  | "usuarios"
  | "roles";


interface CatalogDefinition {
  key: CatalogKey;
  label: string;
  description: string;
  icon: LucideIcon;
  roles: UserRole[];
  component: ComponentType;
}


interface CatalogStats {
  total: number;
  active: number;
  inactive: number;
}


type SummaryState = Record<
  CatalogKey,
  CatalogStats
>;


const EMPTY_STATS: CatalogStats = {
  total: 0,
  active: 0,
  inactive: 0,
};


const INITIAL_SUMMARY: SummaryState = {
  clientes: {
    ...EMPTY_STATS,
  },
  productos: {
    ...EMPTY_STATS,
  },
  categorias: {
    ...EMPTY_STATS,
  },
  empresa: {
    ...EMPTY_STATS,
  },
  sucursales: {
    ...EMPTY_STATS,
  },
  usuarios: {
    ...EMPTY_STATS,
  },
  roles: {
    ...EMPTY_STATS,
  },
};


const ADMIN_MANAGER: UserRole[] = [
  "Administrador",
  "Gerente",
];


const ADMIN_ONLY: UserRole[] = [
  "Administrador",
];


function UsersMaintenance() {
  return (
    <AccessPage mode="users" />
  );
}


function RolesMaintenance() {
  return (
    <AccessPage mode="roles" />
  );
}


const CATALOGS: CatalogDefinition[] = [
  {
    key: "clientes",
    label: "Clientes",
    description:
      "Clientes, documentos, contacto y estado comercial.",
    icon: UsersRound,
    roles: ADMIN_MANAGER,
    component: ClientesPage,
  },
  {
    key: "productos",
    label: "Productos",
    description:
      "Productos, precios, stock y relación con categorías.",
    icon: PackageSearch,
    roles: ADMIN_MANAGER,
    component: ProductosPage,
  },
  {
    key: "categorias",
    label: "Categorías",
    description:
      "Clasificación maestra utilizada por los productos.",
    icon: Tags,
    roles: ADMIN_MANAGER,
    component: CategoriasPage,
  },
  {
    key: "empresa",
    label: "Empresa",
    description:
      "Información principal de la organización.",
    icon: Building2,
    roles: ADMIN_MANAGER,
    component: EmpresaPage,
  },
  {
    key: "sucursales",
    label: "Sucursales",
    description:
      "Sedes y puntos operativos de la empresa.",
    icon: MapPin,
    roles: ADMIN_MANAGER,
    component: SucursalesPage,
  },
  {
    key: "usuarios",
    label: "Usuarios",
    description:
      "Usuarios autorizados para utilizar SalesIA Enterprise.",
    icon: UserRoundCog,
    roles: ADMIN_ONLY,
    component: UsersMaintenance,
  },
  {
    key: "roles",
    label: "Roles",
    description:
      "Roles disponibles y niveles de acceso al sistema.",
    icon: ShieldCheck,
    roles: ADMIN_ONLY,
    component: RolesMaintenance,
  },
];


function statusStats<T extends {
  status: string;
}>(
  items: T[],
): CatalogStats {
  const active =
    items.filter(
      (item) =>
        item.status
          .toLowerCase()
          .trim() === "active",
    ).length;

  return {
    total: items.length,
    active,
    inactive:
      items.length - active,
  };
}


function formatTime(
  value: Date | null,
) {
  if (!value) {
    return "Pendiente";
  }

  return value.toLocaleTimeString(
    "es-PE",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}


function MantenimientoPage() {
  const {
    user,
  } = useAuth();

  const visibleCatalogs =
    useMemo(
      () =>
        CATALOGS.filter(
          (catalog) =>
            user
              ? catalog.roles.includes(
                  user.role,
                )
              : false,
        ),
      [
        user,
      ],
    );

  const [
    selectedCatalog,
    setSelectedCatalog,
  ] =
    useState<CatalogKey>(
      "clientes",
    );

  const [
    catalogSearch,
    setCatalogSearch,
  ] =
    useState("");

  const [
    summary,
    setSummary,
  ] =
    useState<SummaryState>(
      INITIAL_SUMMARY,
    );

  const [
    summaryLoading,
    setSummaryLoading,
  ] =
    useState(true);

  const [
    summaryError,
    setSummaryError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    lastUpdated,
    setLastUpdated,
  ] =
    useState<Date | null>(
      null,
    );


  const filteredCatalogs =
    useMemo(
      () => {
        const term =
          catalogSearch
            .trim()
            .toLowerCase();

        if (!term) {
          return visibleCatalogs;
        }

        return visibleCatalogs.filter(
          (catalog) =>
            catalog.label
              .toLowerCase()
              .includes(term) ||
            catalog.description
              .toLowerCase()
              .includes(term),
        );
      },
      [
        catalogSearch,
        visibleCatalogs,
      ],
    );


  const currentCatalog =
    useMemo(
      () =>
        visibleCatalogs.find(
          (catalog) =>
            catalog.key ===
            selectedCatalog,
        ) ??
        visibleCatalogs[0],
      [
        selectedCatalog,
        visibleCatalogs,
      ],
    );


  useEffect(
    () => {
      if (
        visibleCatalogs.length > 0 &&
        !visibleCatalogs.some(
          (catalog) =>
            catalog.key ===
            selectedCatalog,
        )
      ) {
        setSelectedCatalog(
          visibleCatalogs[0].key,
        );
      }
    },
    [
      selectedCatalog,
      visibleCatalogs,
    ],
  );


  async function loadSummary() {
    if (!user) {
      return;
    }

    setSummaryLoading(true);
    setSummaryError(null);

    try {
      const [
        customers,
        products,
        categories,
        company,
        branches,
      ] =
        await Promise.all([
          getCustomers(),
          getProducts(),
          getCategories(),
          getCompany(),
          getBranches(),
        ]);

      let usersStats =
        INITIAL_SUMMARY.usuarios;

      let rolesStats =
        INITIAL_SUMMARY.roles;

      if (
        user.role ===
        "Administrador"
      ) {
        const [
          users,
          roles,
        ] =
          await Promise.all([
            getUsers(),
            getRoles(),
          ]);

        usersStats =
          statusStats(users);

        rolesStats = {
          total: roles.length,
          active: roles.length,
          inactive: 0,
        };
      }

      setSummary({
        clientes:
          statusStats(
            customers,
          ),

        productos:
          statusStats(
            products,
          ),

        categorias:
          statusStats(
            categories,
          ),

        empresa:
          statusStats([
            company,
          ]),

        sucursales:
          statusStats(
            branches,
          ),

        usuarios:
          usersStats,

        roles:
          rolesStats,
      });

      setLastUpdated(
        new Date(),
      );
    } catch (error) {
      setSummaryError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el resumen de mantenimiento.",
      );
    } finally {
      setSummaryLoading(false);
    }
  }


  useEffect(
    () => {
      void loadSummary();
    },
    [
      user?.id,
    ],
  );


  const overallStats =
    useMemo(
      () =>
        visibleCatalogs.reduce(
          (
            accumulator,
            catalog,
          ) => {
            const stats =
              summary[
                catalog.key
              ];

            accumulator.total +=
              stats.total;

            accumulator.active +=
              stats.active;

            accumulator.inactive +=
              stats.inactive;

            return accumulator;
          },
          {
            total: 0,
            active: 0,
            inactive: 0,
          },
        ),
      [
        summary,
        visibleCatalogs,
      ],
    );


  if (
    !user ||
    !currentCatalog
  ) {
    return null;
  }


  const CurrentComponent =
    currentCatalog.component;

  const CurrentIcon =
    currentCatalog.icon;

  const currentStats =
    summary[
      currentCatalog.key
    ];


  return (
    <section className="maintenance-page">
      <header className="maintenance-header">
        <div>
          <span className="maintenance-eyebrow">
            Administración
          </span>

          <h1>
            Mantenimiento
          </h1>

          <p>
            Administra desde un solo lugar
            los datos maestros utilizados
            por SalesIA Enterprise.
          </p>
        </div>

        <button
          type="button"
          className="maintenance-refresh"
          onClick={() =>
            void loadSummary()
          }
          disabled={summaryLoading}
        >
          <RefreshCw
            size={17}
            className={
              summaryLoading
                ? "is-spinning"
                : ""
            }
          />

          {summaryLoading
            ? "Actualizando..."
            : "Actualizar datos"}
        </button>
      </header>


      <div className="maintenance-stats">
        <article className="maintenance-stat-card">
          <div className="maintenance-stat-icon">
            <Database size={20} />
          </div>

          <div>
            <span>
              Catálogos disponibles
            </span>

            <strong>
              {visibleCatalogs.length}
            </strong>

            <small>
              según tu nivel de acceso
            </small>
          </div>
        </article>


        <article className="maintenance-stat-card">
          <div className="maintenance-stat-icon">
            <Settings2 size={20} />
          </div>

          <div>
            <span>
              Registros
            </span>

            <strong>
              {overallStats.total}
            </strong>

            <small>
              datos maestros registrados
            </small>
          </div>
        </article>


        <article className="maintenance-stat-card">
          <div className="maintenance-stat-icon maintenance-stat-icon-success">
            <CircleCheckBig
              size={20}
            />
          </div>

          <div>
            <span>
              Activos
            </span>

            <strong>
              {overallStats.active}
            </strong>

            <small>
              registros disponibles
            </small>
          </div>
        </article>


        <article className="maintenance-stat-card">
          <div className="maintenance-stat-icon maintenance-stat-icon-muted">
            <CircleOff size={20} />
          </div>

          <div>
            <span>
              Inactivos
            </span>

            <strong>
              {overallStats.inactive}
            </strong>

            <small>
              registros deshabilitados
            </small>
          </div>
        </article>
      </div>


      {summaryError && (
        <div className="maintenance-warning">
          <strong>
            El resumen no pudo actualizarse.
          </strong>

          <span>
            {summaryError}
          </span>
        </div>
      )}


      <div className="maintenance-workspace">
        <aside className="maintenance-catalog-panel">
          <div className="maintenance-catalog-heading">
            <div>
              <span>
                Catálogos
              </span>

              <small>
                Datos maestros
              </small>
            </div>

            <span className="maintenance-update-time">
              {formatTime(
                lastUpdated,
              )}
            </span>
          </div>


          <label className="maintenance-search">
            <Search size={17} />

            <input
              type="search"
              value={catalogSearch}
              onChange={(event) =>
                setCatalogSearch(
                  event.target.value,
                )
              }
              placeholder="Buscar catálogo"
            />
          </label>


          <div className="maintenance-catalog-list">
            {filteredCatalogs.map(
              (catalog) => {
                const Icon =
                  catalog.icon;

                const stats =
                  summary[
                    catalog.key
                  ];

                const selected =
                  catalog.key ===
                  currentCatalog.key;

                return (
                  <button
                    key={
                      catalog.key
                    }
                    type="button"
                    className={`maintenance-catalog-item ${
                      selected
                        ? "is-selected"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedCatalog(
                        catalog.key,
                      )
                    }
                  >
                    <span className="maintenance-catalog-item-main">
                      <span className="maintenance-catalog-item-icon">
                        <Icon
                          size={18}
                        />
                      </span>

                      <span>
                        <strong>
                          {
                            catalog.label
                          }
                        </strong>

                        <small>
                          {
                            catalog.description
                          }
                        </small>
                      </span>
                    </span>

                    <span className="maintenance-catalog-count">
                      {
                        stats.total
                      }
                    </span>
                  </button>
                );
              },
            )}
          </div>
        </aside>


        <div className="maintenance-content">
          <div className="maintenance-current-header">
            <div className="maintenance-current-title">
              <span className="maintenance-current-icon">
                <CurrentIcon
                  size={22}
                />
              </span>

              <div>
                <span className="maintenance-current-eyebrow">
                  Ficha de mantenimiento
                </span>

                <h2>
                  {
                    currentCatalog.label
                  }
                </h2>

                <p>
                  {
                    currentCatalog.description
                  }
                </p>
              </div>
            </div>


            <div className="maintenance-current-stats">
              <div>
                <span>
                  Total
                </span>

                <strong>
                  {currentStats.total}
                </strong>
              </div>

              <div>
                <span>
                  Activos
                </span>

                <strong>
                  {currentStats.active}
                </strong>
              </div>

              <div>
                <span>
                  Inactivos
                </span>

                <strong>
                  {currentStats.inactive}
                </strong>
              </div>
            </div>
          </div>


          <div className="maintenance-module-host">
            <CurrentComponent />
          </div>
        </div>
      </div>
    </section>
  );
}


export default MantenimientoPage;
