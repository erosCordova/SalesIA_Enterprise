import {
  BarChart3,
  BookOpenText,
  Boxes,
  Eye,
  EyeOff,
  FileText,
  LockKeyhole,
  LogIn,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  login,
} from "../../services/auth.service";

import {
  getPublicManuals,
  manualFileUrl,
} from "../../services/manuals.service";

import type {
  ManualDocument,
  ManualType,
} from "../../types/manuals";

import "./login.css";


export default function LoginPage() {
  const [
    dni,
    setDni,
  ] =
    useState("");


  const [
    password,
    setPassword,
  ] =
    useState("");


  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);


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
    manuals,
    setManuals,
  ] =
    useState<
      ManualDocument[]
    >([]);


  const [
    selectedManual,
    setSelectedManual,
  ] =
    useState<
      ManualType | null
    >(null);


  useEffect(
    () => {
      let mounted =
        true;


      getPublicManuals()
        .then(
          (
            data,
          ) => {
            if (mounted) {
              setManuals(
                data,
              );
            }
          },
        )
        .catch(
          () => {
            if (mounted) {
              setManuals(
                [],
              );
            }
          },
        );


      return () => {
        mounted =
          false;
      };
    },
    [],
  );


  const manualMap =
    useMemo(
      () =>
        new Map(
          manuals.map(
            (
              manual,
            ) => [
              manual.manual_type,
              manual,
            ],
          ),
        ),
      [
        manuals,
      ],
    );


  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(
      "",
    );


    if (
      !dni.trim()
      || !password
    ) {
      setError(
        "Ingresa tu DNI y contraseña.",
      );

      return;
    }


    setLoading(
      true,
    );


    try {
      await login({
        dni:
          dni.trim(),

        password,
      });


      window.location.replace(
        "/dashboard",
      );
    } catch (
      currentError
    ) {
      setError(
        currentError
          instanceof Error
          ? currentError.message
          : "No se pudo iniciar sesión.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }


  const selectedDocument =
    selectedManual
      ? manualMap.get(
          selectedManual,
        )
      : undefined;


  return (
    <main className="salesia-login">
      <section className="salesia-login-brand-panel">
        <div className="salesia-login-brand">
          <div className="salesia-login-logo">
            <Sparkles
              size={24}
            />
          </div>

          <div>
            <strong>
              SalesIA
            </strong>

            <span>
              ENTERPRISE
            </span>
          </div>
        </div>


        <div className="salesia-login-presentation">
          <span className="salesia-login-badge">
            <ShieldCheck
              size={15}
            />

            Plataforma empresarial
          </span>


          <h1>
            Gestiona tu negocio
            <em>
              con información inteligente.
            </em>
          </h1>


          <p>
            Ventas, inventario, análisis,
            inteligencia comercial y control
            empresarial en una sola plataforma.
          </p>


          <div className="salesia-login-features">
            <article>
              <span>
                <BarChart3
                  size={19}
                />
              </span>

              <div>
                <strong>
                  Analítica comercial
                </strong>

                <small>
                  Indicadores y comportamiento
                  del negocio.
                </small>
              </div>
            </article>


            <article>
              <span>
                <Boxes
                  size={19}
                />
              </span>

              <div>
                <strong>
                  Operaciones
                </strong>

                <small>
                  Ventas, inventario y Kardex.
                </small>
              </div>
            </article>
          </div>
        </div>


        <footer className="salesia-login-brand-footer">
          <span>
            SalesIA Enterprise
          </span>

          <small>
            Sistema de gestión empresarial
          </small>
        </footer>
      </section>


      <section className="salesia-login-access-panel">
        <div className="salesia-login-card">
          <header>
            <span className="salesia-login-card-eyebrow">
              ACCESO SEGURO
            </span>

            <h2>
              Bienvenido
            </h2>

            <p>
              Ingresa tus credenciales para
              acceder a SalesIA Enterprise.
            </p>
          </header>


          <form
            onSubmit={
              handleSubmit
            }
          >
            <label className="salesia-login-field">
              <span>
                DNI
              </span>

              <div className="salesia-login-input">
                <UserRound
                  size={18}
                />

                <input
                  inputMode="numeric"
                  autoComplete="username"
                  value={
                    dni
                  }
                  disabled={
                    loading
                  }
                  onChange={(
                    event,
                  ) =>
                    setDni(
                      event.target.value,
                    )
                  }
                  placeholder="Ingresa tu DNI"
                />
              </div>
            </label>


            <label className="salesia-login-field">
              <span>
                Contraseña
              </span>

              <div className="salesia-login-input">
                <LockKeyhole
                  size={18}
                />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="current-password"
                  value={
                    password
                  }
                  disabled={
                    loading
                  }
                  onChange={(
                    event,
                  ) =>
                    setPassword(
                      event.target.value,
                    )
                  }
                  placeholder="Ingresa tu contraseña"
                />

                <button
                  type="button"
                  className="salesia-login-eye"
                  disabled={
                    loading
                  }
                  onClick={() =>
                    setShowPassword(
                      (
                        current,
                      ) =>
                        !current,
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                >
                  {showPassword
                    ? (
                      <EyeOff
                        size={17}
                      />
                    )
                    : (
                      <Eye
                        size={17}
                      />
                    )}
                </button>
              </div>
            </label>


            {error && (
              <div className="salesia-login-error">
                {error}
              </div>
            )}


            <button
              type="submit"
              className="salesia-login-submit"
              disabled={
                loading
              }
            >
              <LogIn
                size={18}
              />

              {loading
                ? "Ingresando..."
                : "Iniciar sesión"}
            </button>
          </form>


          <div className="salesia-login-divider">
            <span>
              Documentación
            </span>
          </div>


          <div className="salesia-login-manuals">
            <button
              type="button"
              disabled={
                !manualMap.has(
                  "user",
                )
              }
              title={
                manualMap.has(
                  "user",
                )
                  ? "Abrir manual de usuario"
                  : "Manual todavía no publicado"
              }
              onClick={() =>
                setSelectedManual(
                  "user",
                )
              }
            >
              <BookOpenText
                size={15}
              />

              Manual de usuario
            </button>


            <button
              type="button"
              disabled={
                !manualMap.has(
                  "technical",
                )
              }
              title={
                manualMap.has(
                  "technical",
                )
                  ? "Abrir manual técnico"
                  : "Manual todavía no publicado"
              }
              onClick={() =>
                setSelectedManual(
                  "technical",
                )
              }
            >
              <FileText
                size={15}
              />

              Manual técnico
            </button>
          </div>


          <div className="salesia-login-security">
            <ShieldCheck
              size={14}
            />

            Acceso protegido mediante roles y permisos.
          </div>
        </div>
      </section>


      {selectedManual
        && selectedDocument
        && (
          <div className="salesia-manual-viewer">
            <button
              type="button"
              className="salesia-manual-viewer-backdrop"
              onClick={() =>
                setSelectedManual(
                  null,
                )
              }
              aria-label="Cerrar manual"
            />

            <section className="salesia-manual-viewer-dialog">
              <header>
                <div>
                  <span>
                    SOLO LECTURA
                  </span>

                  <h3>
                    {
                      selectedDocument.title
                    }
                  </h3>
                </div>

                <button
                  type="button"
                  className="salesia-manual-close"
                  onClick={() =>
                    setSelectedManual(
                      null,
                    )
                  }
                  aria-label="Cerrar manual"
                >
                  <X
                    size={19}
                  />
                </button>
              </header>


              <iframe
                title={
                  selectedDocument.title
                }
                src={
                  `${
                    manualFileUrl(
                      selectedManual,
                    )
                  }#toolbar=0&navpanes=0`
                }
              />
            </section>
          </div>
        )}
    </main>
  );
}
