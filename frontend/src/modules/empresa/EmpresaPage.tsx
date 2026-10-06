import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  Building2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  getCompany,
  updateCompany,
} from "../../services/organization.service";

import {
  useApiResource,
} from "../../hooks/useApiResource";


interface CompanyForm {
  name: string;
  businessName: string;
  taxId: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  status: "active" | "inactive";
}


const INITIAL_FORM: CompanyForm = {
  name: "",
  businessName: "",
  taxId: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  country: "Perú",
  status: "active",
};


function valueOrDash(
  value: string | null | undefined,
) {
  return value?.trim() || "No registrado";
}


function EmpresaPage() {
  const {
    data: company,
    loading,
    error,
    reload,
  } = useApiResource(
    getCompany,
  );


  const [
    editOpen,
    setEditOpen,
  ] = useState(false);


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    form,
    setForm,
  ] = useState<CompanyForm>(
    INITIAL_FORM,
  );


  const [
    formError,
    setFormError,
  ] = useState("");


  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");


  useEffect(
    () => {
      if (!company) {
        return;
      }

      setForm({
        name:
          company.name ?? "",

        businessName:
          company.business_name ??
          "",

        taxId:
          company.tax_id ?? "",

        email:
          company.email ?? "",

        phone:
          company.phone ?? "",

        address:
          company.address ?? "",

        city:
          company.city ?? "",

        country:
          company.country ||
          "Perú",

        status:
          company.status ===
          "inactive"
            ? "inactive"
            : "active",
      });
    },
    [
      company,
    ],
  );


  function openEditor() {
    if (!company) {
      return;
    }

    setForm({
      name:
        company.name ?? "",

      businessName:
        company.business_name ??
        "",

      taxId:
        company.tax_id ?? "",

      email:
        company.email ?? "",

      phone:
        company.phone ?? "",

      address:
        company.address ?? "",

      city:
        company.city ?? "",

      country:
        company.country ||
        "Perú",

      status:
        company.status ===
        "inactive"
          ? "inactive"
          : "active",
    });

    setFormError("");
    setSuccessMessage("");
    setEditOpen(true);
  }


  function closeEditor() {
    if (saving) {
      return;
    }

    setFormError("");
    setEditOpen(false);
  }


  async function handleSubmit(
    event: FormEvent,
  ) {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");


    if (!form.name.trim()) {
      setFormError(
        "El nombre de la empresa es obligatorio.",
      );

      return;
    }


    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim(),
      )
    ) {
      setFormError(
        "Ingresa un correo electrónico válido.",
      );

      return;
    }


    setSaving(true);

    try {
      await updateCompany({
        name:
          form.name.trim(),

        business_name:
          form.businessName
            .trim() ||
          null,

        tax_id:
          form.taxId
            .trim() ||
          null,

        email:
          form.email
            .trim() ||
          null,

        phone:
          form.phone
            .trim() ||
          null,

        address:
          form.address
            .trim() ||
          null,

        city:
          form.city
            .trim() ||
          null,

        country:
          form.country
            .trim() ||
          null,

        status:
          form.status,
      });


      await reload();


      setEditOpen(false);

      setSuccessMessage(
        "Información de la empresa actualizada correctamente.",
      );
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "No se pudieron actualizar los datos de la empresa.",
      );
    } finally {
      setSaving(false);
    }
  }


  if (loading) {
    return (
      <section className="dashboard-page">
        <div className="page-heading">
          <div>
            <span className="page-eyebrow">
              CONFIGURACIÓN ORGANIZACIONAL
            </span>

            <h1>
              Empresa
            </h1>

            <p>
              Cargando información empresarial...
            </p>
          </div>
        </div>
      </section>
    );
  }


  if (error) {
    return (
      <section className="dashboard-page">
        <div className="page-heading">
          <div>
            <span className="page-eyebrow">
              CONFIGURACIÓN ORGANIZACIONAL
            </span>

            <h1>
              Empresa
            </h1>

            <p>
              {error}
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              void reload()
            }
          >
            <RefreshCw
              size={17}
            />

            Reintentar
          </button>
        </div>
      </section>
    );
  }


  if (!company) {
    return (
      <section className="dashboard-page">
        <div className="page-heading">
          <div>
            <span className="page-eyebrow">
              CONFIGURACIÓN ORGANIZACIONAL
            </span>

            <h1>
              Empresa
            </h1>

            <p>
              No existe información empresarial.
            </p>
          </div>
        </div>
      </section>
    );
  }


  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">
            CONFIGURACIÓN ORGANIZACIONAL
          </span>

          <h1>
            Empresa
          </h1>

          <p>
            Información de la organización
            asociada al usuario autenticado.
          </p>
        </div>


        <div className="table-toolbar-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              void reload()
            }
          >
            <RefreshCw
              size={17}
            />

            Actualizar
          </button>


          <button
            type="button"
            className="primary-button"
            onClick={
              openEditor
            }
          >
            <Pencil
              size={17}
            />

            Editar empresa
          </button>
        </div>
      </div>


      {successMessage && (
        <article
          className="panel"
          style={{
            borderColor:
              "#a7f3d0",
            background:
              "#ecfdf5",
          }}
        >
          <strong
            style={{
              color:
                "#047857",
            }}
          >
            {
              successMessage
            }
          </strong>
        </article>
      )}


      <div className="stats-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="panel-label">
                EMPRESA
              </span>

              <h3>
                {
                  company.name
                }
              </h3>
            </div>

            <Building2
              size={20}
            />
          </div>

          <p>
            {valueOrDash(
              company.business_name,
            )}
          </p>
        </article>


        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="panel-label">
                IDENTIFICACIÓN
              </span>

              <h3>
                RUC / Tax ID
              </h3>
            </div>

            <ShieldCheck
              size={20}
            />
          </div>

          <p>
            {valueOrDash(
              company.tax_id,
            )}
          </p>
        </article>


        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="panel-label">
                ESTADO
              </span>

              <h3>
                {
                  company.status ===
                  "active"
                    ? "Activa"
                    : "Inactiva"
                }
              </h3>
            </div>

            <ShieldCheck
              size={20}
            />
          </div>

          <p>
            {
              company.status ===
              "active"
                ? "Empresa habilitada para operar."
                : "Empresa actualmente deshabilitada."
            }
          </p>
        </article>
      </div>


      <div className="dashboard-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="panel-label">
                CONTACTO
              </span>

              <h3>
                Información empresarial
              </h3>
            </div>
          </div>


          <div className="dashboard-list">
            <div className="dashboard-list-item">
              <div>
                <strong>
                  <Mail
                    size={15}
                  />

                  {" "}
                  Correo
                </strong>

                <span>
                  {valueOrDash(
                    company.email,
                  )}
                </span>
              </div>
            </div>


            <div className="dashboard-list-item">
              <div>
                <strong>
                  <Phone
                    size={15}
                  />

                  {" "}
                  Teléfono
                </strong>

                <span>
                  {valueOrDash(
                    company.phone,
                  )}
                </span>
              </div>
            </div>


            <div className="dashboard-list-item">
              <div>
                <strong>
                  <MapPin
                    size={15}
                  />

                  {" "}
                  Dirección
                </strong>

                <span>
                  {valueOrDash(
                    company.address,
                  )}
                </span>
              </div>
            </div>


            <div className="dashboard-list-item">
              <div>
                <strong>
                  Ciudad / País
                </strong>

                <span>
                  {[
                    company.city,
                    company.country,
                  ]
                    .filter(
                      Boolean,
                    )
                    .join(", ") ||
                    "No registrado"}
                </span>
              </div>
            </div>
          </div>
        </article>
      </div>


      {editOpen && (
        <div
          className="modal-overlay"
          role="presentation"
        >
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="company-edit-title"
          >
            <div className="modal-header">
              <div>
                <span className="page-eyebrow">
                  MANTENIMIENTO DE EMPRESA
                </span>

                <h2
                  id="company-edit-title"
                >
                  Editar empresa
                </h2>

                <p>
                  Actualiza la información
                  institucional utilizada por
                  SalesIA Enterprise.
                </p>
              </div>


              <button
                type="button"
                className="secondary-button"
                onClick={
                  closeEditor
                }
                disabled={
                  saving
                }
                aria-label="Cerrar"
              >
                <X
                  size={18}
                />
              </button>
            </div>


            <form
              onSubmit={
                handleSubmit
              }
            >
              <div className="access-form-grid">
                <label>
                  Nombre de la empresa

                  <input
                    value={
                      form.name
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm({
                        ...form,
                        name:
                          event
                            .target
                            .value,
                      })
                    }
                    placeholder="SalesIA Enterprise"
                    required
                  />
                </label>


                <label>
                  Razón social

                  <input
                    value={
                      form.businessName
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm({
                        ...form,
                        businessName:
                          event
                            .target
                            .value,
                      })
                    }
                    placeholder="Razón social"
                  />
                </label>


                <label>
                  RUC / Tax ID

                  <input
                    value={
                      form.taxId
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm({
                        ...form,
                        taxId:
                          event
                            .target
                            .value,
                      })
                    }
                    placeholder="20123456789"
                  />
                </label>


                <label>
                  Estado

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
                          event
                            .target
                            .value as
                            | "active"
                            | "inactive",
                      })
                    }
                  >
                    <option value="active">
                      Activa
                    </option>

                    <option value="inactive">
                      Inactiva
                    </option>
                  </select>
                </label>


                <label>
                  Correo electrónico

                  <input
                    type="email"
                    value={
                      form.email
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm({
                        ...form,
                        email:
                          event
                            .target
                            .value,
                      })
                    }
                    placeholder="empresa@correo.com"
                  />
                </label>


                <label>
                  Teléfono

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
                          event
                            .target
                            .value,
                      })
                    }
                    placeholder="+51 999 999 999"
                  />
                </label>


                <label>
                  Ciudad

                  <input
                    value={
                      form.city
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm({
                        ...form,
                        city:
                          event
                            .target
                            .value,
                      })
                    }
                    placeholder="Lima"
                  />
                </label>


                <label>
                  País

                  <input
                    value={
                      form.country
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm({
                        ...form,
                        country:
                          event
                            .target
                            .value,
                      })
                    }
                    placeholder="Perú"
                  />
                </label>


                <label
                  className="form-full"
                >
                  Dirección

                  <input
                    value={
                      form.address
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm({
                        ...form,
                        address:
                          event
                            .target
                            .value,
                      })
                    }
                    placeholder="Dirección principal"
                  />
                </label>
              </div>


              {formError && (
                <p
                  style={{
                    marginTop:
                      "16px",
                    color:
                      "#b91c1c",
                    fontWeight:
                      700,
                  }}
                >
                  {formError}
                </p>
              )}


              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    closeEditor
                  }
                  disabled={
                    saving
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
                  <Save
                    size={17}
                  />

                  {saving
                    ? "Guardando..."
                    : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}


export default EmpresaPage;
