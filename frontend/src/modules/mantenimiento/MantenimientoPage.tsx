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
  MapPin,
  PackageSearch,
  Search,
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


type CatalogGroup =
  | "Comercial"
  | "Organización"
  | "Acceso";


interface CatalogDefinition {
  key: CatalogKey;
  label: string;
  description: string;
  group: CatalogGroup;
  icon: LucideIcon;
  roles: UserRole[];
  component: ComponentType;
}


const ADMIN_MANAGER: UserRole[] = [
  "Administrador",
  "Gerente",
];


const ADMIN_ONLY: UserRole[] = [
  "Administrador",
];


function UsersMaintenance() {
  return (
    <AccessPage
      mode="users"
    />
  );
}


function RolesMaintenance() {
  return (
    <AccessPage
      mode="roles"
    />
  );
}


const CATALOGS: CatalogDefinition[] = [
  {
    key: "clientes",
    label: "Clientes",
    description:
      "Información comercial, documentos y contacto.",
    group: "Comercial",
    icon: UsersRound,
    roles: ADMIN_MANAGER,
    component: ClientesPage,
  },
  {
    key: "productos",
    label: "Productos",
    description:
      "Catálogo, precios, stock y categorías.",
    group: "Comercial",
    icon: PackageSearch,
    roles: ADMIN_MANAGER,
    component: ProductosPage,
  },
  {
    key: "categorias",
    label: "Categorías",
    description:
      "Clasificación de los productos.",
    group: "Comercial",
    icon: Tags,
    roles: ADMIN_MANAGER,
    component: CategoriasPage,
  },
  {
    key: "empresa",
    label: "Empresa",
    description:
      "Información principal de la organización.",
    group: "Organización",
    icon: Building2,
    roles: ADMIN_MANAGER,
    component: EmpresaPage,
  },
  {
    key: "sucursales",
    label: "Sucursales",
    description:
      "Sedes y puntos operativos.",
    group: "Organización",
    icon: MapPin,
    roles: ADMIN_MANAGER,
    component: SucursalesPage,
  },
  {
    key: "usuarios",
    label: "Usuarios",
    description:
      "Personas autorizadas para utilizar SalesIA.",
    group: "Acceso",
    icon: UserRoundCog,
    roles: ADMIN_ONLY,
    component: UsersMaintenance,
  },
  {
    key: "roles",
    label: "Roles",
    description:
      "Perfiles y niveles de acceso.",
    group: "Acceso",
    icon: ShieldCheck,
    roles: ADMIN_ONLY,
    component: RolesMaintenance,
  },
];


const GROUP_ORDER: CatalogGroup[] = [
  "Comercial",
  "Organización",
  "Acceso",
];


export default function MantenimientoPage() {
  const {
    user,
  } = useAuth();


  const [
    selectedCatalog,
    setSelectedCatalog,
  ] =
    useState<CatalogKey>(
      "clientes",
    );


  const [
    search,
    setSearch,
  ] =
    useState("");


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


  const filteredCatalogs =
    useMemo(
      () => {
        const query =
          search
            .normalize("NFD")
            .replace(
              /[\u0300-\u036f]/g,
              "",
            )
            .trim()
            .toLowerCase();

        if (!query) {
          return visibleCatalogs;
        }

        return visibleCatalogs.filter(
          (catalog) => {
            const text =
              `${catalog.label} ${catalog.description} ${catalog.group}`
                .normalize("NFD")
                .replace(
                  /[\u0300-\u036f]/g,
                  "",
                )
                .toLowerCase();

            return text.includes(
              query,
            );
          },
        );
      },
      [
        search,
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
        )
        ?? visibleCatalogs[0],
      [
        selectedCatalog,
        visibleCatalogs,
      ],
    );


  useEffect(
    () => {
      if (
        visibleCatalogs.length > 0
        && !visibleCatalogs.some(
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


  if (
    !user
    || !currentCatalog
  ) {
    return null;
  }


  const CurrentComponent =
    currentCatalog.component;


  const CurrentIcon =
    currentCatalog.icon;


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
            Gestiona los datos maestros,
            la organización y los accesos
            de SalesIA Enterprise.
          </p>
        </div>
      </header>


      <div className="maintenance-workspace">
        <aside className="maintenance-navigation">
          <div className="maintenance-navigation-header">
            <strong>
              Módulos
            </strong>

            <span>
              Selecciona qué deseas administrar
            </span>
          </div>


          <label className="maintenance-search">
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
              ) =>
                setSearch(
                  event
                    .target
                    .value,
                )
              }
              placeholder="Buscar módulo..."
            />
          </label>


          <nav className="maintenance-groups">
            {GROUP_ORDER.map(
              (group) => {
                const items =
                  filteredCatalogs.filter(
                    (catalog) =>
                      catalog.group ===
                      group,
                  );

                if (
                  items.length === 0
                ) {
                  return null;
                }

                return (
                  <div
                    key={
                      group
                    }
                    className="maintenance-group"
                  >
                    <span className="maintenance-group-title">
                      {group}
                    </span>


                    <div className="maintenance-group-items">
                      {items.map(
                        (
                          catalog,
                        ) => {
                          const Icon =
                            catalog.icon;

                          const selected =
                            catalog.key ===
                            currentCatalog.key;

                          return (
                            <button
                              key={
                                catalog.key
                              }
                              type="button"
                              className={`maintenance-nav-item ${
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
                              <span className="maintenance-nav-icon">
                                <Icon
                                  size={17}
                                />
                              </span>

                              <span className="maintenance-nav-text">
                                <strong>
                                  {catalog.label}
                                </strong>

                                <small>
                                  {
                                    catalog
                                      .description
                                  }
                                </small>
                              </span>
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>
                );
              },
            )}


            {filteredCatalogs.length ===
              0 && (
              <div className="maintenance-no-results">
                No se encontraron módulos.
              </div>
            )}
          </nav>
        </aside>


        <main className="maintenance-content">
          <div className="maintenance-current-header">
            <div className="maintenance-current-icon">
              <CurrentIcon
                size={21}
              />
            </div>

            <div>
              <span>
                {currentCatalog.group}
              </span>

              <h2>
                {currentCatalog.label}
              </h2>

              <p>
                {
                  currentCatalog
                    .description
                }
              </p>
            </div>
          </div>


          <div className="maintenance-module-host">
            <CurrentComponent />
          </div>
        </main>
      </div>
    </section>
  );
}
