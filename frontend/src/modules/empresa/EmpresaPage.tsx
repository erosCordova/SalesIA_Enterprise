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
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import Modal from "../../components/ui/Modal";
import ModuleState from "../../components/ui/ModuleState";

import {
  getCompany,
  updateCompany,
} from "../../services/organization.service";

import {
  useApiResource,
} from "../../hooks/useApiResource";

import "./empresa-commercial.css";


interface CompanyForm {
  name: string;
  businessName: string;
  taxId: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  status:
    | "active"
    | "inactive";
}


const INITIAL_FORM:
  CompanyForm = {
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
  value:
    | string
    | null
    | undefined,
) {
  return (
    value?.trim()
    || "No registrado"
  );
}


function EmpresaPage() {
  const {
    data: company,
    loading,
    error,
    reload,
  } =
    useApiResource(
      getCompany,
    );


  const [
    editOpen,
    setEditOpen,
  ] =
    useState(false);


  const [
    saving,
    setSaving,
  ] =
    useState(false);


  const [
    form,
    setForm,
  ] =
    useState<CompanyForm>(
      INITIAL_FORM,
    );


  const [
    formError,
    setFormError,
  ] =
    useState("");


  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState("");


  useEffect(
    () => {
      if (
        !company
      ) {
        return;
      }

      setForm({
        name:
          company.name
          ?? "",

        businessName:
          company.business_name
          ?? "",

        taxId:
          company.tax_id
          ?? "",

        email:
          company.email
          ?? "",

        phone:
          company.phone
          ?? "",

        address:
          company.address
          ?? "",

        city:
          company.city
          ?? "",

        country:
          company.country
          || "Perú",

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


  function fillForm() {
    if (
      !company
    ) {
      return;
    }

    setForm({
      name:
        company.name
        ?? "",

      businessName:
        company.business_name
        ?? "",

      taxId:
        company.tax_id
        ?? "",

      email:
        company.email
        ?? "",

      phone:
        company.phone
        ?? "",

      address:
        company.address
        ?? "",

      city:
        company.city
        ?? "",

      country:
        company.country
        || "Perú",

      status:
        company.status ===
          "inactive"
          ? "inactive"
          : "active",
    });
  }


  function openEditor() {
    fillForm();

    setFormError(
      "",
    );

    setSuccessMessage(
      "",
    );

    setEditOpen(
      true,
    );
  }


  function closeEditor() {
    if (
      saving
    ) {
      return;
    }

    fillForm();

    setFormError(
      "",
    );

    setEditOpen(
      false,
    );
  }


  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setFormError(
      "",
    );

    setSuccessMessage(
      "",
    );


    if (
      !form.name.trim()
    ) {
      setFormError(
        "El nombre de la empresa es obligatorio.",
      );

      return;
    }


    if (
      form.email.trim()
      && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim(),
      )
    ) {
      setFormError(
        "Ingresa un correo electrónico válido.",
      );

      return;
    }


    setSaving(
      true,
    );


    try {
      await updateCompany({
        name:
          form.name.trim(),

        business_name:
          form.businessName
            .trim()
          || null,

        tax_id:
          form.taxId
            .trim()
          || null,

        email:
          form.email
            .trim()
          || null,

        phone:
          form.phone
            .trim()
          || null,

        address:
          form.address
            .trim()
          || null,

        city:
          form.city
            .trim()
          || null,

        country:
          form.country
            .trim()
          || null,

        status:
          form.status,
      });


      await reload();

      setEditOpen(
        false,
      );

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
      setSaving(
        false,
      );
    }
  }


  if (
    loading
  ) {
    return (
      <section className="company-page">
        <div className="company-title">
          <span>
            Configuración organizacional
          </span>

          <h2>
            Empresa
          </h2>
        </div>

        <ModuleState
          type="loading"
          title="Cargando empresa"
          description="Consultando la información empresarial."
        />
      </section>
    );
  }


  if (
    error
  ) {
    return (
      <section className="company-page">
        <div className="company-title">
          <span>
            Configuración organizacional
          </span>

          <h2>
            Empresa
          </h2>
        </div>

        <ModuleState
          type="error"
          title="No se pudo cargar la empresa"
          description={
            error
          }
        />

        <div className="company-retry">
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              void reload()
            }
          >
            <RefreshCw
              size={15}
            />

            Reintentar
          </button>
        </div>
      </section>
    );
  }


  if (
    !company
  ) {
    return (
      <section className="company-page">
        <div className="company-title">
          <span>
            Configuración organizacional
          </span>

          <h2>
            Empresa
          </h2>
        </div>

        <ModuleState
          type="empty"
          title="Sin información empresarial"
          description="No existe información de empresa registrada."
        />
      </section>
    );
  }


  return (
    <section className="company-page">
      <div className="company-heading">
        <div className="company-title">
          <span>
            Configuración organizacional
          </span>

          <h2>
            Empresa
          </h2>

          <p>
            Información institucional de la organización.
          </p>
        </div>


        <button
          type="button"
          className="primary-button company-edit-button"
          onClick={
            openEditor
          }
        >
          <Pencil
            size={15}
          />

          Editar empresa
        </button>
      </div>


      {successMessage && (
        <ModuleState
          type="success"
          title="Operación completada"
          description={
            successMessage
          }
        />
      )}


      <article className="company-profile">
        <div className="company-profile-header">
          <div className="company-logo">
            <Building2
              size={25}
            />
          </div>


          <div className="company-identity">
            <span>
              Empresa
            </span>

            <h3>
              {company.name}
            </h3>

            <p>
              {valueOrDash(
                company.business_name,
              )}
            </p>
          </div>


          <span
            className={`status-badge ${
              company.status ===
                "active"
                ? "success"
                : "inactive"
            }`}
          >
            {company.status ===
              "active"
              ? "Activa"
              : "Inactiva"}
          </span>
        </div>


        <div className="company-section">
          <div className="company-section-title">
            <ShieldCheck
              size={16}
            />

            <div>
              <strong>
                Identificación
              </strong>

              <span>
                Información fiscal y legal
              </span>
            </div>
          </div>


          <div className="company-data-grid">
            <div className="company-data-item">
              <span>
                Nombre comercial
              </span>

              <strong>
                {valueOrDash(
                  company.name,
                )}
              </strong>
            </div>


            <div className="company-data-item">
              <span>
                Razón social
              </span>

              <strong>
                {valueOrDash(
                  company.business_name,
                )}
              </strong>
            </div>


            <div className="company-data-item">
              <span>
                RUC / Tax ID
              </span>

              <strong>
                {valueOrDash(
                  company.tax_id,
                )}
              </strong>
            </div>


            <div className="company-data-item">
              <span>
                Estado
              </span>

              <strong>
                {company.status ===
                  "active"
                  ? "Activa"
                  : "Inactiva"}
              </strong>
            </div>
          </div>
        </div>


        <div className="company-section">
          <div className="company-section-title">
            <Mail
              size={16}
            />

            <div>
              <strong>
                Contacto
              </strong>

              <span>
                Datos de comunicación
              </span>
            </div>
          </div>


          <div className="company-data-grid">
            <div className="company-data-item">
              <span>
                Correo electrónico
              </span>

              <strong>
                {valueOrDash(
                  company.email,
                )}
              </strong>
            </div>


            <div className="company-data-item">
              <span>
                Teléfono
              </span>

              <strong>
                {valueOrDash(
                  company.phone,
                )}
              </strong>
            </div>
          </div>
        </div>


        <div className="company-section">
          <div className="company-section-title">
            <MapPin
              size={16}
            />

            <div>
              <strong>
                Ubicación
              </strong>

              <span>
                Dirección principal
              </span>
            </div>
          </div>


          <div className="company-data-grid">
            <div className="company-data-item company-data-wide">
              <span>
                Dirección
              </span>

              <strong>
                {valueOrDash(
                  company.address,
                )}
              </strong>
            </div>


            <div className="company-data-item">
              <span>
                Ciudad
              </span>

              <strong>
                {valueOrDash(
                  company.city,
                )}
              </strong>
            </div>


            <div className="company-data-item">
              <span>
                País
              </span>

              <strong>
                {valueOrDash(
                  company.country,
                )}
              </strong>
            </div>
          </div>
        </div>
      </article>


      <Modal
        open={
          editOpen
        }
        title="Editar empresa"
        description="Actualiza la información institucional de la organización."
        onClose={
          closeEditor
        }
      >
        <form
          className="enterprise-form"
          onSubmit={
            handleSubmit
          }
        >
          {formError && (
            <ModuleState
              type="error"
              title="No se pudo actualizar"
              description={
                formError
              }
            />
          )}


          <div className="form-grid">
            <label>
              <span>
                Nombre de la empresa
              </span>

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
                      event.target.value,
                  })
                }
                placeholder="SalesIA Enterprise"
                required
              />
            </label>


            <label>
              <span>
                Razón social
              </span>

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
                      event.target.value,
                  })
                }
                placeholder="Razón social"
              />
            </label>


            <label>
              <span>
                RUC / Tax ID
              </span>

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
                      event.target.value,
                  })
                }
                placeholder="20123456789"
              />
            </label>


            <label>
              <span>
                Estado
              </span>

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
                      event.target.value ===
                        "active"
                        ? "active"
                        : "inactive",
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
              <span>
                Correo electrónico
              </span>

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
                      event.target.value,
                  })
                }
                placeholder="empresa@correo.com"
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


            <label>
              <span>
                Ciudad
              </span>

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
                      event.target.value,
                  })
                }
                placeholder="Lima"
              />
            </label>


            <label>
              <span>
                País
              </span>

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
                      event.target.value,
                  })
                }
                placeholder="Perú"
              />
            </label>


            <label className="form-full">
              <span>
                Dirección
              </span>

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
                      event.target.value,
                  })
                }
                placeholder="Dirección principal"
              />
            </label>
          </div>


          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={
                saving
              }
              onClick={
                closeEditor
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
                : "Guardar cambios"}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}


export default EmpresaPage;
