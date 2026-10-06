import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  CheckCircle2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRoundCheck,
  UserRoundX,
  UsersRound,
  X,
} from "lucide-react";

import {
  createUser,
  getRoles,
  getUsers,
  updateUser,
} from "../../services/users.service";

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


const initialForm: UserForm = {
  dni: "",
  first_name: "",
  last_name: "",
  phone: "",
  password: "",
  role: "Vendedor",
  status: "active",
};


const ROLE_SCOPE:
  Record<
    UserRole,
    string
  > = {
  Administrador:
    "Control total del sistema, mantenimiento, usuarios y auditoría.",

  Gerente:
    "Supervisión comercial, inventario, inteligencia y mantenimiento empresarial.",

  Vendedor:
    "Registro y consulta de ventas.",

  Analista:
    "Analytics, probabilidad, insights y reportes.",

  Almacén:
    "Inventario, existencias y Kardex.",
};


export default function AccessPage({
  mode = "all",
}: AccessPageProps) {
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
    setLoading(true);
    setError("");

    try {
      const [
        usersResponse,
        rolesResponse,
      ] =
        await Promise.all([
          getUsers(),
          getRoles(),
        ]);

      setUsers(
        usersResponse,
      );

      setRoles(
        rolesResponse,
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar los datos de acceso.",
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(
    () => {
      void loadData();
    },
    [],
  );


  const filteredUsers =
    useMemo(
      () => {
        const value =
          search
            .trim()
            .toLowerCase();

        if (!value) {
          return users;
        }

        return users.filter(
          (user) => {
            const fullName =
              `${user.first_name} ${user.last_name}`
                .toLowerCase();

            return (
              user.dni
                .includes(value)
              ||
              fullName
                .includes(value)
              ||
              user.role
                .toLowerCase()
                .includes(value)
              ||
              user.status
                .toLowerCase()
                .includes(value)
            );
          },
        );
      },
      [
        users,
        search,
      ],
    );


  const activeUsers =
    users.filter(
      (user) =>
        user.status ===
        "active",
    ).length;


  const inactiveUsers =
    users.length -
    activeUsers;


  function openCreate() {
    setEditingUser(null);

    setForm(
      initialForm,
    );

    setError("");
    setSuccess("");
    setModalOpen(true);
  }


  function openEdit(
    user: UserListItem,
  ) {
    setEditingUser(user);

    setForm({
      dni:
        user.dni,

      first_name:
        user.first_name,

      last_name:
        user.last_name,

      phone:
        user.phone ?? "",

      password:
        "",

      role:
        user.role,

      status:
        user.status ===
        "inactive"
          ? "inactive"
          : "active",
    });

    setError("");
    setSuccess("");
    setModalOpen(true);
  }


  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingUser(null);
  }


  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      form.first_name
        .trim()
        .length < 2
      ||
      form.last_name
        .trim()
        .length < 2
    ) {
      setError(
        "Ingresa nombres y apellidos válidos.",
      );

      return;
    }

    if (!editingUser) {
      if (
        !/^\d{8}$/
          .test(form.dni)
      ) {
        setError(
          "El DNI debe contener exactamente 8 números.",
        );

        return;
      }

      if (
        form.password
          .length < 8
      ) {
        setError(
          "La contraseña debe tener al menos 8 caracteres.",
        );

        return;
      }
    }

    setSaving(true);

    try {
      if (editingUser) {
        const updated =
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
                form.role,

              status:
                form.status,
            },
          );

        setSuccess(
          `Usuario ${updated.first_name} ${updated.last_name} actualizado correctamente.`,
        );
      } else {
        const created =
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
          `Usuario ${created.first_name} ${created.last_name} creado correctamente.`,
        );
      }

      setModalOpen(false);
      setEditingUser(null);
      setForm(initialForm);

      await loadData();

    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar el usuario.",
      );
    } finally {
      setSaving(false);
    }
  }


  async function toggleStatus(
    user: UserListItem,
  ) {
    setError("");
    setSuccess("");

    const nextStatus:
      UserStatus =
      user.status ===
      "active"
        ? "inactive"
        : "active";

    try {
      await updateUser(
        user.id,
        {
          first_name:
            user.first_name,

          last_name:
            user.last_name,

          phone:
            user.phone,

          role:
            user.role,

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


  const showUsers =
    mode === "all"
    || mode === "users";

  const showRoles =
    mode === "all"
    || mode === "roles";


  return (
    <div className="access-page">
      {mode === "all" && (
        <div className="access-header">
          <div>
            <div className="access-eyebrow">
              <ShieldCheck size={16} />

              ACCESO Y SEGURIDAD
            </div>

            <h1>
              Usuarios y roles
            </h1>

            <p>
              Gestiona las cuentas autorizadas
              y consulta los niveles de acceso
              definidos en SalesIA Enterprise.
            </p>
          </div>
        </div>
      )}


      {showUsers && (
        <>
          <div className="access-summary access-summary-v2">
            <div className="access-summary-card">
              <UsersRound size={22} />

              <div>
                <span>
                  Usuarios
                </span>

                <strong>
                  {users.length}
                </strong>
              </div>
            </div>

            <div className="access-summary-card">
              <CheckCircle2 size={22} />

              <div>
                <span>
                  Activos
                </span>

                <strong>
                  {activeUsers}
                </strong>
              </div>
            </div>

            <div className="access-summary-card">
              <UserRoundX size={22} />

              <div>
                <span>
                  Inactivos
                </span>

                <strong>
                  {inactiveUsers}
                </strong>
              </div>
            </div>
          </div>


          {error && !modalOpen && (
            <div className="access-message error">
              {error}
            </div>
          )}

          {success && (
            <div className="access-message success">
              {success}
            </div>
          )}


          <section className="access-panel">
            <div className="access-toolbar">
              <div className="access-search">
                <Search size={18} />

                <input
                  type="search"
                  placeholder="Buscar por DNI, nombre, rol o estado..."
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="access-toolbar-buttons">
                <button
                  type="button"
                  className="access-secondary-button"
                  onClick={() =>
                    void loadData()
                  }
                  disabled={loading}
                >
                  <RefreshCw
                    size={17}
                    className={
                      loading
                        ? "access-spin"
                        : ""
                    }
                  />

                  Actualizar
                </button>

                <button
                  type="button"
                  className="access-primary-button"
                  onClick={openCreate}
                >
                  <Plus size={18} />

                  Nuevo usuario
                </button>
              </div>
            </div>


            {loading ? (
              <div className="access-state">
                Cargando usuarios...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="access-state">
                No se encontraron usuarios.
              </div>
            ) : (
              <div className="access-table-wrapper">
                <table className="access-table">
                  <thead>
                    <tr>
                      <th>DNI</th>
                      <th>Usuario</th>
                      <th>Rol</th>
                      <th>Teléfono</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredUsers.map(
                      (user) => (
                        <tr key={user.id}>
                          <td>
                            <strong>
                              {user.dni}
                            </strong>
                          </td>

                          <td>
                            <div className="access-user-cell">
                              <div className="access-avatar">
                                {user.first_name
                                  .charAt(0)
                                  .toUpperCase()}

                                {user.last_name
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <strong>
                                  {user.first_name}{" "}
                                  {user.last_name}
                                </strong>

                                <span>
                                  {user.company}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span className="access-role">
                              {user.role}
                            </span>
                          </td>

                          <td>
                            {user.phone || "—"}
                          </td>

                          <td>
                            <span
                              className={
                                user.status ===
                                "active"
                                  ? "access-status active"
                                  : "access-status inactive"
                              }
                            >
                              {user.status ===
                              "active"
                                ? "Activo"
                                : "Inactivo"}
                            </span>
                          </td>

                          <td>
                            <div className="access-row-actions">
                              <button
                                type="button"
                                className="icon-button"
                                title="Editar usuario"
                                onClick={() =>
                                  openEdit(user)
                                }
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                type="button"
                                className="icon-button"
                                title={
                                  user.status ===
                                  "active"
                                    ? "Desactivar"
                                    : "Reactivar"
                                }
                                onClick={() =>
                                  void toggleStatus(
                                    user,
                                  )
                                }
                              >
                                {user.status ===
                                "active" ? (
                                  <UserRoundX
                                    size={16}
                                  />
                                ) : (
                                  <UserRoundCheck
                                    size={16}
                                  />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}


      {showRoles && (
        <section className="access-roles-section">
          <div className="access-section-heading">
            <div>
              <span>
                SEGURIDAD
              </span>

              <h2>
                Roles del sistema
              </h2>

              <p>
                Los roles son estructurales y sus
                permisos se aplican tanto en el
                frontend como en el backend.
              </p>
            </div>

            <ShieldCheck size={24} />
          </div>


          <div className="access-role-grid">
            {roles.map(
              (role) => (
                <article
                  key={role.id}
                  className="access-role-card"
                >
                  <div className="access-role-card-icon">
                    <ShieldCheck
                      size={20}
                    />
                  </div>

                  <strong>
                    {role.name}
                  </strong>

                  <p>
                    {role.description
                      || ROLE_SCOPE[
                        role.name
                      ]}
                  </p>

                  <small>
                    {ROLE_SCOPE[
                      role.name
                    ]}
                  </small>
                </article>
              ),
            )}
          </div>
        </section>
      )}


      {modalOpen && (
        <div
          className="access-modal-backdrop"
          onMouseDown={closeModal}
        >
          <div
            className="access-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="access-modal-header">
              <div>
                <div className="access-modal-icon">
                  {editingUser ? (
                    <Pencil size={21} />
                  ) : (
                    <UsersRound size={21} />
                  )}
                </div>

                <div>
                  <h2>
                    {editingUser
                      ? "Editar usuario"
                      : "Nuevo usuario"}
                  </h2>

                  <p>
                    {editingUser
                      ? "Actualiza datos, rol y estado."
                      : "Crea una nueva cuenta de acceso."}
                  </p>
                </div>
              </div>

              <button
                className="access-close"
                onClick={closeModal}
                type="button"
              >
                <X size={20} />
              </button>
            </div>


            <form
              onSubmit={handleSubmit}
              className="access-form"
            >
              {error && (
                <div className="access-message error">
                  {error}
                </div>
              )}

              <div className="access-form-grid">
                <label>
                  <span>DNI</span>

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    value={form.dni}
                    disabled={
                      Boolean(
                        editingUser,
                      )
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        dni:
                          event.target
                            .value
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
                  />
                </label>


                <label>
                  <span>Rol</span>

                  <select
                    value={form.role}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        role:
                          event.target.value as UserRole,
                      })
                    }
                  >
                    {roles.map(
                      (role) => (
                        <option
                          key={role.id}
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
                  <span>Nombres</span>

                  <input
                    value={
                      form.first_name
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        first_name:
                          event.target
                            .value,
                      })
                    }
                  />
                </label>


                <label>
                  <span>Apellidos</span>

                  <input
                    value={
                      form.last_name
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        last_name:
                          event.target
                            .value,
                      })
                    }
                  />
                </label>


                <label>
                  <span>Teléfono</span>

                  <input
                    value={form.phone}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        phone:
                          event.target
                            .value,
                      })
                    }
                  />
                </label>


                {editingUser ? (
                  <label>
                    <span>Estado</span>

                    <select
                      value={
                        form.status
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm({
                          ...form,
                          status:
                            event.target.value as UserStatus,
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
                    <span>Contraseña</span>

                    <input
                      type="password"
                      value={
                        form.password
                      }
                      autoComplete="new-password"
                      onChange={(event) =>
                        setForm({
                          ...form,
                          password:
                            event.target
                              .value,
                        })
                      }
                    />
                  </label>
                )}
              </div>


              <div className="access-form-info">
                El DNI no puede modificarse
                después de crear la cuenta porque
                forma parte de la identidad de
                acceso del usuario.
              </div>


              <div className="access-modal-actions">
                <button
                  type="button"
                  className="access-secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="access-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Guardando..."
                    : editingUser
                      ? "Guardar cambios"
                      : "Crear usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
