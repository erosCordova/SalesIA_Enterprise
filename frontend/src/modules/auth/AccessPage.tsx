import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  UserRoundCheck,
  UserRoundX,
} from "lucide-react";

import DataTable, {
  type DataTableColumn,
} from "../../components/ui/DataTable";

import Modal from "../../components/ui/Modal";
import ModuleState from "../../components/ui/ModuleState";
import Pagination from "../../components/ui/Pagination";

import {
  createUser,
  getRoles,
  getUsers,
  updateUser,
} from "../../services/users.service";

import {
  useAuth,
} from "../../services/auth.context";

import type {
  UserRole,
} from "../../types/auth";

import type {
  RoleResponse,
  UserListItem,
  UserStatus,
} from "../../types/users";

import "./access.css";


type AccessMode =
  | "all"
  | "users"
  | "roles";


interface AccessPageProps {
  mode?: AccessMode;
}


interface UserForm {
  dni: string;
  first_name: string;
  last_name: string;
  phone: string;
  password: string;
  role: UserRole;
  status: UserStatus;
}


const PAGE_SIZE = 8;


const initialForm:
  UserForm = {
    dni: "",
    first_name: "",
    last_name: "",
    phone: "",
    password: "",
    role: "Vendedor",
    status: "active",
  };


const ROLE_SCOPE:
  Partial<Record<UserRole, string>> = {
    Administrador:
      "Administración general, mantenimiento, usuarios y auditoría.",

    Gerente:
      "Supervisión comercial, inventario, análisis y mantenimiento empresarial.",

    Vendedor:
      "Gestión y consulta de operaciones de venta.",

    Analista:
      "Análisis, probabilidad, insights y reportes.",

    Almacén:
      "Control de inventario, existencias y Kardex.",
  };


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


function statusLabel(
  status: string,
) {
  return status === "active"
    ? "Activo"
    : "Inactivo";
}


export default function AccessPage({
  mode = "all",
}: AccessPageProps) {
  const {
    user: currentUser,
  } =
    useAuth();
const showUsers =
    mode === "all"
    || mode === "users";


  const showRoles =
    mode === "all"
    || mode === "roles";


  const [
    users,
    setUsers,
  ] =
    useState<UserListItem[]>(
      [],
    );


  const [
    roles,
    setRoles,
  ] =
    useState<RoleResponse[]>(
      [],
    );


  const [
    search,
    setSearch,
  ] =
    useState("");


  const [
    roleFilter,
    setRoleFilter,
  ] =
    useState("");


  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("");


  const [
    page,
    setPage,
  ] =
    useState(1);


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    saving,
    setSaving,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    success,
    setSuccess,
  ] =
    useState("");


  const [
    modalOpen,
    setModalOpen,
  ] =
    useState(false);


  const [
    editingUser,
    setEditingUser,
  ] =
    useState<UserListItem | null>(
      null,
    );


  const [
    form,
    setForm,
  ] =
    useState<UserForm>(
      initialForm,
    );


  async function loadData() {
    setLoading(
      true,
    );

    setError(
      "",
    );


    try {
      const rolesResponse =
        await getRoles();

      setRoles(
        rolesResponse,
      );


      if (
        showUsers
      ) {
        const usersResponse =
          await getUsers();

        setUsers(
          usersResponse,
        );
      } else {
        setUsers(
          [],
        );
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar los datos de acceso.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }


  useEffect(
    () => {
      void loadData();
    },
    [
      mode,
    ],
  );


  const filteredUsers =
    useMemo(
      () => {
        const query =
          normalize(
            search,
          );


        return users.filter(
          (item) => {
            const fullName =
              `${item.first_name} ${item.last_name}`;


            const matchesSearch =
              !query
              || [
                item.dni,
                fullName,
                item.phone,
                item.role,
                item.company,
              ].some(
                (value) =>
                  normalize(
                    String(
                      value
                      ?? "",
                    ),
                  ).includes(
                    query,
                  ),
              );


            const matchesRole =
              !roleFilter
              || item.role ===
                roleFilter;


            const matchesStatus =
              !statusFilter
              || item.status ===
                statusFilter;


            return (
              matchesSearch
              && matchesRole
              && matchesStatus
            );
          },
        );
      },
      [
        users,
        search,
        roleFilter,
        statusFilter,
      ],
    );


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredUsers.length
        / PAGE_SIZE,
      ),
    );


  const safePage =
    Math.min(
      page,
      totalPages,
    );


  const paginatedUsers =
    useMemo(
      () => {
        const start =
          (
            safePage - 1
          )
          * PAGE_SIZE;


        return filteredUsers.slice(
          start,
          start + PAGE_SIZE,
        );
      },
      [
        filteredUsers,
        safePage,
      ],
    );


  function isCurrentUser(
    item: UserListItem,
  ) {
    return (
      currentUser?.id ===
      item.id
    );
  }


  const columns:
    DataTableColumn<UserListItem>[] = [
      {
        key:
          "dni",

        label:
          "DNI",

        render:
          (item) => (
            <strong className="access-dni">
              {item.dni}
            </strong>
          ),
      },

      {
        key:
          "user",

        label:
          "Usuario",

        render:
          (item) => (
            <div className="access-user-cell">
              <div className="access-avatar">
                {item.first_name
                  .charAt(0)
                  .toUpperCase()}

                {item.last_name
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>
                  {item.first_name}{" "}
                  {item.last_name}
                </strong>

                <span>
                  {item.company}
                </span>
              </div>
            </div>
          ),
      },

      {
        key:
          "role",

        label:
          "Rol",

        render:
          (item) => (
            <span className="access-role">
              {item.role}
            </span>
          ),
      },

      {
        key:
          "phone",

        label:
          "Teléfono",

        render:
          (item) => (
            <span>
              {item.phone
                || "No registrado"}
            </span>
          ),
      },

      {
        key:
          "status",

        label:
          "Estado",

        render:
          (item) => (
            <span
              className={`status-badge ${
                item.status ===
                  "active"
                  ? "success"
                  : "inactive"
              }`}
            >
              {statusLabel(
                item.status,
              )}
            </span>
          ),
      },
    ];


  function resetForm() {
    setEditingUser(
      null,
    );

    setForm(
      initialForm,
    );

    setError(
      "",
    );
  }


  function openCreate() {
    resetForm();

    setSuccess(
      "",
    );

    setModalOpen(
      true,
    );
  }


  function openEdit(
    item: UserListItem,
  ) {
    setEditingUser(
      item,
    );

    setForm({
      dni:
        item.dni,

      first_name:
        item.first_name,

      last_name:
        item.last_name,

      phone:
        item.phone
        ?? "",

      password:
        "",

      role:
        item.role,

      status:
        item.status ===
          "inactive"
          ? "inactive"
          : "active",
    });

    setError(
      "",
    );

    setSuccess(
      "",
    );

    setModalOpen(
      true,
    );
  }


  function closeModal() {
    if (
      saving
    ) {
      return;
    }

    setModalOpen(
      false,
    );

    resetForm();
  }


  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(
      "",
    );

    setSuccess(
      "",
    );


    if (
      form.first_name
        .trim()
        .length < 2
      || form.last_name
        .trim()
        .length < 2
    ) {
      setError(
        "Ingresa nombres y apellidos válidos.",
      );

      return;
    }


    if (
      !editingUser
      && !/^\d{8}$/.test(
        form.dni,
      )
    ) {
      setError(
        "El DNI debe contener exactamente 8 números.",
      );

      return;
    }


    if (
      !editingUser
      && form.password.length < 8
    ) {
      setError(
        "La contraseña debe tener al menos 8 caracteres.",
      );

      return;
    }


    setSaving(
      true,
    );


    try {
      if (
        editingUser
      ) {
        const self =
          isCurrentUser(
            editingUser,
          );


        await updateUser(
          editingUser.id,
          {
            first_name:
              form.first_name
                .trim(),

            last_name:
              form.last_name
                .trim(),

            phone:
              form.phone
                .trim()
              || null,

            role:
              self
                ? "Administrador"
                : form.role,

            status:
              self
                ? "active"
                : form.status,
          },
        );


        setSuccess(
          "Usuario actualizado correctamente.",
        );
      } else {
        await createUser({
          dni:
            form.dni,

          first_name:
            form.first_name
              .trim(),

          last_name:
            form.last_name
              .trim(),

          password:
            form.password,

          role:
            form.role,

          phone:
            form.phone
              .trim()
            || null,

          status:
            form.status,
        });


        setSuccess(
          "Usuario creado correctamente.",
        );
      }


      setModalOpen(
        false,
      );

      resetForm();

      setPage(
        1,
      );

      await loadData();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar el usuario.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }


  async function toggleStatus(
    item: UserListItem,
  ) {
    if (
      isCurrentUser(
        item,
      )
    ) {
      setError(
        "No puedes desactivar tu propia cuenta.",
      );

      return;
    }


    setError(
      "",
    );

    setSuccess(
      "",
    );


    const nextStatus:
      UserStatus =
      item.status ===
        "active"
        ? "inactive"
        : "active";


    try {
      await updateUser(
        item.id,
        {
          first_name:
            item.first_name,

          last_name:
            item.last_name,

          phone:
            item.phone,

          role:
            item.role,

          status:
            nextStatus,
        },
      );


      setSuccess(
        nextStatus ===
          "active"
          ? "Usuario reactivado correctamente."
          : "Usuario desactivado correctamente.",
      );


      await loadData();
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "No se pudo cambiar el estado del usuario.",
      );
    }
  }




  return (
    <div className="access-page">
      {mode === "all" && (
        <div className="access-main-title">
          <span>
            Acceso y seguridad
          </span>

          <h2>
            Usuarios y roles
          </h2>

          <p>
            Administración de cuentas y niveles de acceso.
          </p>
        </div>
      )}


      {error && !modalOpen && (
        <ModuleState
          type="error"
          title="No se pudo completar la operación"
          description={
            error
          }
        />
      )}


      {success && (
        <ModuleState
          type="success"
          title="Operación completada"
          description={
            success
          }
        />
      )}


      {showUsers && (
        <section className="access-users-section">
          <div className="access-section-title">
            <div>
              <span>
                Administración de acceso
              </span>

              <h2>
                Usuarios
              </h2>

              <p>
                {filteredUsers.length}{" "}
                {filteredUsers.length ===
                  1
                  ? "usuario"
                  : "usuarios"}
                {" "}
                en la vista actual
              </p>
            </div>
          </div>


          <div
            className="access-toolbar"
          >
            <div className="access-filters">
              <label className="access-search">
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

                    setPage(
                      1,
                    );
                  }}
                  placeholder="Buscar usuario..."
                />
              </label>


              <select
                value={
                  roleFilter
                }
                onChange={(
                  event,
                ) => {
                  setRoleFilter(
                    event.target.value,
                  );

                  setPage(
                    1,
                  );
                }}
              >
                <option value="">
                  Todos los roles
                </option>

                {roles.map(
                  (role) => (
                    <option
                      key={
                        role.id
                      }
                      value={
                        role.name
                      }
                    >
                      {role.name}
                    </option>
                  ),
                )}
              </select>


              <select
                value={
                  statusFilter
                }
                onChange={(
                  event,
                ) => {
                  setStatusFilter(
                    event.target.value,
                  );

                  setPage(
                    1,
                  );
                }}
              >
                <option value="">
                  Todos los estados
                </option>

                <option value="active">
                  Activos
                </option>

                <option value="inactive">
                  Inactivos
                </option>
              </select>
            </div>


            <div className="access-toolbar-actions">


              <button
                type="button"
                className="primary-button access-new-button"
                onClick={
                  openCreate
                }
              >
                <Plus
                  size={15}
                />

                Nuevo usuario
              </button>
            </div>
          </div>


          <article className="access-table-panel">
            {loading ? (
              <ModuleState
                type="loading"
                title="Cargando usuarios"
                description="Consultando las cuentas registradas."
              />
            ) : filteredUsers.length ===
              0 ? (
              <ModuleState
                type="empty"
                title="No encontramos usuarios"
                description={
                  search
                  || roleFilter
                  || statusFilter
                    ? "No existen usuarios que coincidan con los filtros."
                    : "No existen usuarios registrados."
                }
              />
            ) : (
              <>
                <DataTable
                  columns={
                    columns
                  }
                  data={
                    paginatedUsers
                  }
                  getRowKey={(
                    item,
                  ) =>
                    item.id
                  }
                  actions={(
                    item,
                  ) => (
                    <div className="table-actions">
                      <button
                        type="button"
                        className="icon-button"
                        title="Editar usuario"
                        disabled={
                          saving
                        }
                        onClick={() =>
                          openEdit(
                            item,
                          )
                        }
                      >
                        <Pencil
                          size={15}
                        />
                      </button>


                      <button
                        type="button"
                        className="icon-button"
                        disabled={
                          saving
                          || isCurrentUser(
                            item,
                          )
                        }
                        title={
                          isCurrentUser(
                            item,
                          )
                            ? "No puedes desactivar tu propia cuenta"
                            : item.status ===
                                "active"
                              ? "Desactivar usuario"
                              : "Reactivar usuario"
                        }
                        onClick={() =>
                          void toggleStatus(
                            item,
                          )
                        }
                      >
                        {item.status ===
                          "active" ? (
                          <UserRoundX
                            size={15}
                          />
                        ) : (
                          <UserRoundCheck
                            size={15}
                          />
                        )}
                      </button>
                    </div>
                  )}
                />


                <Pagination
                  page={
                    safePage
                  }
                  totalPages={
                    totalPages
                  }
                  onPageChange={
                    setPage
                  }
                />
              </>
            )}
          </article>
        </section>
      )}


      {showRoles && (
        <section className="access-roles-section">
          <div className="access-roles-heading">
            <div>
              <span>
                Niveles de acceso
              </span>

              <h2>
                Roles
              </h2>

              <p>
                {roles.length}{" "}
                {roles.length ===
                  1
                  ? "rol disponible"
                  : "roles disponibles"}
              </p>
            </div>
          </div>


          {loading ? (
            <ModuleState
              type="loading"
              title="Cargando roles"
              description="Consultando los roles disponibles."
            />
          ) : roles.length ===
            0 ? (
            <ModuleState
              type="empty"
              title="No hay roles disponibles"
              description="No existen roles configurados."
            />
          ) : (
            <div className="access-role-grid">
              {roles.map(
                (role) => (
                  <article
                    key={
                      role.id
                    }
                    className="access-role-card"
                  >
                    <div className="access-role-icon">
                      <ShieldCheck
                        size={18}
                      />
                    </div>

                    <div>
                      <strong>
                        {role.name}
                      </strong>

                      <p>
                        {role.description
                          || ROLE_SCOPE[
                            role.name
                          ]}
                      </p>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
        </section>
      )}


      <Modal
        open={
          modalOpen
        }
        title={
          editingUser
            ? "Editar usuario"
            : "Nuevo usuario"
        }
        description={
          editingUser
            ? "Actualiza los datos, rol y estado de la cuenta."
            : "Registra una nueva cuenta de acceso."
        }
        onClose={
          closeModal
        }
      >
        <form
          className="enterprise-form"
          onSubmit={
            handleSubmit
          }
        >
          {error && (
            <ModuleState
              type="error"
              title="No se pudo guardar"
              description={
                error
              }
            />
          )}


          <div className="form-grid">
            <label>
              <span>
                DNI
              </span>

              <input
                type="text"
                inputMode="numeric"
                maxLength={8}
                value={
                  form.dni
                }
                disabled={
                  Boolean(
                    editingUser,
                  )
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,

                    dni:
                      event.target.value
                        .replace(
                          /\D/g,
                          "",
                        )
                        .slice(
                          0,
                          8,
                        ),
                  })
                }
                placeholder="12345678"
                required
              />
            </label>


            <label>
              <span>
                Rol
              </span>

              <select
                value={
                  form.role
                }
                disabled={
                  Boolean(
                    editingUser
                    && isCurrentUser(
                      editingUser,
                    ),
                  )
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,

                    role:
                      event.target.value as
                        UserRole,
                  })
                }
              >
                {roles.map(
                  (role) => (
                    <option
                      key={
                        role.id
                      }
                      value={
                        role.name
                      }
                    >
                      {role.name}
                    </option>
                  ),
                )}
              </select>
            </label>


            <label>
              <span>
                Nombres
              </span>

              <input
                value={
                  form.first_name
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,

                    first_name:
                      event.target.value,
                  })
                }
                required
              />
            </label>


            <label>
              <span>
                Apellidos
              </span>

              <input
                value={
                  form.last_name
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,

                    last_name:
                      event.target.value,
                  })
                }
                required
              />
            </label>


            <label>
              <span>
                Teléfono
              </span>

              <input
                value={
                  form.phone
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,

                    phone:
                      event.target.value,
                  })
                }
                placeholder="+51 999 999 999"
              />
            </label>


            {editingUser ? (
              <label>
                <span>
                  Estado
                </span>

                <select
                  value={
                    form.status
                  }
                  disabled={
                    isCurrentUser(
                      editingUser,
                    )
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm({
                      ...form,

                      status:
                        event.target.value as
                          UserStatus,
                    })
                  }
                >
                  <option value="active">
                    Activo
                  </option>

                  <option value="inactive">
                    Inactivo
                  </option>
                </select>
              </label>
            ) : (
              <label>
                <span>
                  Contraseña
                </span>

                <input
                  type="password"
                  value={
                    form.password
                  }
                  minLength={8}
                  autoComplete="new-password"
                  onChange={(
                    event,
                  ) =>
                    setForm({
                      ...form,

                      password:
                        event.target.value,
                    })
                  }
                  required
                />
              </label>
            )}
          </div>


          <p className="access-form-note">
            El DNI identifica la cuenta y no puede modificarse después de crear el usuario.
          </p>


          {editingUser
            && isCurrentUser(
              editingUser,
            ) && (
            <p className="access-form-note">
              Tu propia cuenta debe permanecer activa y conservar el rol Administrador.
            </p>
          )}


          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={
                saving
              }
              onClick={
                closeModal
              }
            >
              Cancelar
            </button>


            <button
              type="submit"
              className="primary-button"
              disabled={
                saving
              }
            >
              {saving
                ? "Guardando..."
                : editingUser
                  ? "Guardar cambios"
                  : "Crear usuario"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
