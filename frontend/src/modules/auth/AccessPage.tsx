import { useEffect, useMemo, useState, type FormEvent } from "react";

import {
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";

import { createUser, getRoles, getUsers } from "../../services/users.service";

import type { UserRole } from "../../types/auth";

import type { RoleResponse, UserListItem } from "../../types/users";

import "./access.css";

const initialForm = {
  dni: "",
  first_name: "",
  last_name: "",
  phone: "",
  password: "",
  role: "Vendedor" as UserRole,
};

const ROLE_GUIDANCE: Record<
  UserRole,
  { summary: string; areas: string[] }
> = {
  Administrador: {
    summary:
      "Administra los usuarios y la configuración, y puede acceder a todas las áreas del sistema.",
    areas: [
      "Gestión comercial",
      "Inventario",
      "Análisis y reportes",
      "Auditoría",
      "Acceso y seguridad",
    ],
  },
  Gerente: {
    summary:
      "Supervisa la operación y consulta la información comercial y los resultados del negocio.",
    areas: [
      "Gestión comercial",
      "Inventario",
      "Empresa y sucursales",
      "Análisis y reportes",
    ],
  },
  Vendedor: {
    summary: "Atiende clientes y registra las ventas que le corresponden.",
    areas: [
      "Clientes",
      "Ventas",
      "Productos",
      "Panel general",
    ],
  },
  Analista: {
    summary:
      "Trabaja con los datos y consulta los resultados de análisis del negocio.",
    areas: [
      "Análisis",
      "Probabilidad",
      "Insights",
      "Reportes",
      "Panel general",
    ],
  },
  Almacén: {
    summary:
      "Consulta productos y administra las existencias y sus movimientos.",
    areas: [
      "Productos",
      "Categorías",
      "Inventario",
      "Panel general",
    ],
  },
};

export default function AccessPage() {
  const [users, setUsers] = useState<UserListItem[]>([]);

  const [roles, setRoles] = useState<RoleResponse[]>([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState(initialForm);

  const selectedRoleGuidance = ROLE_GUIDANCE[form.role];

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        getUsers(),
        getRoles(),
      ]);

      setUsers(usersResponse);
      setRoles(rolesResponse);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar los usuarios.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filteredUsers = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return users;
    }

    return users.filter((user) => {
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();

      return (
        user.dni.includes(value) ||
        fullName.includes(value) ||
        user.role.toLowerCase().includes(value)
      );
    });
  }, [users, search]);

  function openModal() {
    setForm(initialForm);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!/^\d{8}$/.test(form.dni)) {
      setError("El DNI debe contener exactamente 8 números.");
      return;
    }

    if (form.first_name.trim().length < 2 || form.last_name.trim().length < 2) {
      setError("Ingresa los nombres y apellidos del usuario.");
      return;
    }

    if (form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setSaving(true);

    try {
      const created = await createUser({
        dni: form.dni,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        password: form.password,
        role: form.role,
        phone: form.phone.trim() || null,
        status: "active",
      });

      setSuccess(
        `Usuario ${created.first_name} ${created.last_name} creado correctamente.`,
      );

      setModalOpen(false);
      setForm(initialForm);

      await loadData();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo crear el usuario.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="access-page">
      <div className="access-header">
        <div>
          <div className="access-eyebrow">
            <ShieldCheck size={16} />
            ACCESO Y SEGURIDAD
          </div>

          <h1>Administración de usuarios</h1>

          <p>
            Crea las cuentas de acceso y asigna el rol correspondiente a cada
            integrante de la empresa.
          </p>
        </div>

        <button className="access-primary-button" onClick={openModal}>
          <Plus size={18} />
          Nuevo usuario
        </button>
      </div>

      <div className="access-summary">
        <div className="access-summary-card">
          <UsersRound size={22} />

          <div>
            <span>Usuarios registrados</span>

            <strong>{users.length}</strong>
          </div>
        </div>

        <div className="access-summary-card">
          <ShieldCheck size={22} />

          <div>
            <span>Roles disponibles</span>

            <strong>{roles.length}</strong>
          </div>
        </div>
      </div>

      {error && !modalOpen && (
        <div className="access-message error">{error}</div>
      )}

      {success && <div className="access-message success">{success}</div>}

      <section className="access-panel">
        <div className="access-toolbar">
          <div className="access-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Buscar por DNI, usuario o rol..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <button
            className="access-secondary-button"
            onClick={() => void loadData()}
            disabled={loading}
          >
            <RefreshCw size={17} className={loading ? "access-spin" : ""} />
            Actualizar
          </button>
        </div>

        {loading ? (
          <div className="access-state">Cargando usuarios...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="access-state">No se encontraron usuarios.</div>
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
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.dni}</strong>
                    </td>

                    <td>
                      <div className="access-user-cell">
                        <div className="access-avatar">
                          {user.first_name.charAt(0).toUpperCase()}
                          {user.last_name.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {user.first_name} {user.last_name}
                          </strong>

                          <span>{user.company}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="access-role">{user.role}</span>
                    </td>

                    <td>{user.phone || "—"}</td>

                    <td>
                      <span
                        className={
                          user.status === "active"
                            ? "access-status active"
                            : "access-status inactive"
                        }
                      >
                        {user.status === "active" ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="access-modal-backdrop" onMouseDown={closeModal}>
          <div
            className="access-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="access-modal-header">
              <div>
                <div className="access-modal-icon">
                  <UserPlus size={21} />
                </div>

                <div>
                  <h2>Nuevo usuario</h2>

                  <p>El administrador asignará las credenciales de acceso.</p>
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

            <form onSubmit={handleSubmit} className="access-form">
              {error && <div className="access-message error">{error}</div>}

              <div className="access-form-grid">
                <label>
                  <span>DNI</span>

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="12345678"
                    value={form.dni}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        dni: event.target.value.replace(/\D/g, "").slice(0, 8),
                      })
                    }
                  />
                </label>

                <label>
                  <span>Rol y nivel de acceso</span>

                  <select
                    value={form.role}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        role: event.target.value as UserRole,
                      })
                    }
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.name}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="access-role-guidance" aria-live="polite">
                  <strong>{form.role}</strong>
                  <p>{selectedRoleGuidance.summary}</p>
                  <span>Áreas disponibles</span>
                  <ul>
                    {selectedRoleGuidance.areas.map((area) => (
                      <li key={area}>{area}</li>
                    ))}
                  </ul>
                </div>

                <label>
                  <span>Nombres</span>

                  <input
                    type="text"
                    placeholder="Nombres"
                    value={form.first_name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        first_name: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  <span>Apellidos</span>

                  <input
                    type="text"
                    placeholder="Apellidos"
                    value={form.last_name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        last_name: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  <span>Teléfono</span>

                  <input
                    type="text"
                    placeholder="Opcional"
                    value={form.phone}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        phone: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  <span>Contraseña</span>

                  <input
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={form.password}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        password: event.target.value,
                      })
                    }
                    autoComplete="new-password"
                  />
                </label>
              </div>

              <div className="access-form-info">
                El usuario iniciará sesión únicamente con su DNI y la contraseña
                que asignes aquí.
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
                  <UserPlus size={18} />

                  {saving ? "Creando..." : "Crear usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
