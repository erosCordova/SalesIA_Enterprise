import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Building2,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import {
  createBranch,
  getBranches,
} from "../../services/organization.service";

import {
  useApiResource,
} from "../../hooks/useApiResource";


const initialForm = {
  code: "",
  name: "",
  address: "",
  city: "",
  country: "Perú",
  phone: "",
  email: "",
};


export default function SucursalesPage() {
  const {
    data,
    setData,
    loading,
    error,
    reload,
  } = useApiResource(
    getBranches,
  );

  const branches = data ?? [];

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    formError,
    setFormError,
  ] = useState("");

  const [
    form,
    setForm,
  ] = useState(initialForm);


  const filteredBranches =
    useMemo(
      () => {
        const value = search
          .trim()
          .toLowerCase();

        if (!value) {
          return branches;
        }

        return branches.filter(
          (branch) =>
            branch.name
              .toLowerCase()
              .includes(value) ||
            branch.code
              .toLowerCase()
              .includes(value) ||
            (branch.city || "")
              .toLowerCase()
              .includes(value),
        );
      },
      [
        branches,
        search,
      ],
    );


  async function handleSubmit(
    event: FormEvent,
  ) {
    event.preventDefault();

    setFormError("");

    if (
      !form.code.trim() ||
      !form.name.trim()
    ) {
      setFormError(
        "Código y nombre son obligatorios.",
      );
      return;
    }

    setSaving(true);

    try {
      const created =
        await createBranch({
          code: form.code.trim(),
          name: form.name.trim(),
          address:
            form.address.trim() || null,
          city:
            form.city.trim() || null,
          country:
            form.country.trim() || "Perú",
          phone:
            form.phone.trim() || null,
          email:
            form.email.trim() || null,
          status: "active",
        });

      setData([
        ...branches,
        created,
      ]);

      setForm(
        initialForm,
      );

      setModalOpen(false);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "No se pudo crear la sucursal.",
      );
    } finally {
      setSaving(false);
    }
  }


  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">
            ESTRUCTURA ORGANIZACIONAL
          </span>

          <h1>Sucursales</h1>

          <p>
            Establecimientos y puntos
            operativos vinculados con la empresa.
          </p>
        </div>

        <div className="table-toolbar-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => void reload()}
          >
            <RefreshCw size={17} />
            Actualizar
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={() =>
              setModalOpen(true)
            }
          >
            <Plus size={17} />
            Nueva sucursal
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="panel-label">
                TOTAL
              </span>
              <h3>
                {branches.length}
              </h3>
            </div>

            <Building2 size={20} />
          </div>

          <p>
            Sucursales registradas
          </p>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="panel-label">
                ACTIVAS
              </span>
              <h3>
                {
                  branches.filter(
                    (branch) =>
                      branch.status ===
                      "active",
                  ).length
                }
              </h3>
            </div>

            <MapPin size={20} />
          </div>
        </article>
      </div>

      <article className="panel">
        <div className="table-toolbar">
          <div className="table-search">
            <Search size={17} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Buscar sucursal..."
            />
          </div>
        </div>

        {loading && (
          <p>
            Cargando sucursales...
          </p>
        )}

        {error && (
          <p>
            {error}
          </p>
        )}

        {!loading &&
          !error &&
          filteredBranches.length === 0 && (
            <div className="dashboard-list-empty">
              No hay sucursales registradas.
            </div>
          )}

        {!loading &&
          !error &&
          filteredBranches.length > 0 && (
            <div className="enterprise-table-wrapper">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Sucursal</th>
                    <th>Ubicación</th>
                    <th>Contacto</th>
                    <th>Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBranches.map(
                    (branch) => (
                      <tr key={branch.id}>
                        <td>
                          {branch.code}
                        </td>

                        <td>
                          <strong>
                            {branch.name}
                          </strong>
                        </td>

                        <td>
                          {[
                            branch.address,
                            branch.city,
                            branch.country,
                          ]
                            .filter(Boolean)
                            .join(", ") ||
                            "No registrada"}
                        </td>

                        <td>
                          {branch.phone ||
                            branch.email ||
                            "No registrado"}
                        </td>

                        <td>
                          <span>
                            {branch.status ===
                            "active"
                              ? "Activa"
                              : "Inactiva"}
                          </span>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
      </article>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <span className="page-eyebrow">
                  NUEVA SUCURSAL
                </span>

                <h2>
                  Registrar sucursal
                </h2>
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setModalOpen(false)
                }
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
            >
              <div className="access-form-grid">
                <label>
                  Código
                  <input
                    value={form.code}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        code:
                          event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Nombre
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        name:
                          event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Ciudad
                  <input
                    value={form.city}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        city:
                          event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  País
                  <input
                    value={form.country}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        country:
                          event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Dirección
                  <input
                    value={form.address}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        address:
                          event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Teléfono
                  <input
                    value={form.phone}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        phone:
                          event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Correo
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        email:
                          event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              {formError && (
                <p>
                  {formError}
                </p>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setModalOpen(false)
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Guardando..."
                    : "Crear sucursal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
