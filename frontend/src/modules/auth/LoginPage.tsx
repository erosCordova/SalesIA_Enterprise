import { type FormEvent, useState } from "react";

import {
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  useAuth,
} from "../../services/auth.context";

function LoginPage() {
  const {
    login,
  } = useAuth();

  const [dni, setDni] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (!dni.trim()) {
      setError(
        "Ingresa tu DNI.",
      );

      return;
    }

    if (!password) {
      setError(
        "Ingresa tu contraseña.",
      );

      return;
    }

    setLoading(true);

    try {
      await login({
        dni: dni.trim(),
        password,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible iniciar sesión.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-background-shape login-background-shape-one" />
      <div className="login-background-shape login-background-shape-two" />

      <main className="login-container">
        <section className="login-brand-panel">
          <div className="login-brand">
            <div className="login-brand-mark">
              S
            </div>

            <div>
              <strong>
                SalesIA
              </strong>

              <span>
                Enterprise
              </span>
            </div>
          </div>

          <div className="login-brand-content">
            <span className="login-eyebrow">
              PLATAFORMA EMPRESARIAL
            </span>

            <h1>
              Gestión comercial
              <br />
              basada en datos.
            </h1>

            <p>
              Administra ventas, inventario,
              indicadores y análisis desde
              una plataforma centralizada.
            </p>
          </div>

          <div className="login-security">
            <ShieldCheck size={18} />

            <div>
              <strong>
                Acceso protegido
              </strong>

              <span>
                Autenticación mediante DNI
                y contraseña.
              </span>
            </div>
          </div>
        </section>

        <section className="login-form-panel">
          <div className="login-form-wrapper">
            <div className="login-form-header">
              <span className="login-form-icon">
                <LockKeyhole size={22} />
              </span>

              <div>
                <span className="login-form-eyebrow">
                  ACCESO AL SISTEMA
                </span>

                <h2>
                  Iniciar sesión
                </h2>
              </div>
            </div>

            <p className="login-form-description">
              Ingresa tus credenciales para
              acceder a SalesIA Enterprise.
            </p>

            <form
              className="login-form"
              onSubmit={handleSubmit}
            >
              <label
                className="login-field"
                htmlFor="dni"
              >
                <span>
                  DNI
                </span>

                <div className="login-input-wrapper">
                  <UserRound size={18} />

                  <input
                    id="dni"
                    type="text"
                    inputMode="numeric"
                    autoComplete="username"
                    placeholder="Ingresa tu DNI"
                    value={dni}
                    maxLength={20}
                    disabled={loading}
                    onChange={(event) =>
                      setDni(
                        event.target.value,
                      )
                    }
                  />
                </div>
              </label>

              <label
                className="login-field"
                htmlFor="password"
              >
                <span>
                  Contraseña
                </span>

                <div className="login-input-wrapper">
                  <LockKeyhole size={18} />

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    disabled={loading}
                    onChange={(event) =>
                      setPassword(
                        event.target.value,
                      )
                    }
                  />

                  <button
                    type="button"
                    className="login-password-toggle"
                    aria-label={
                      showPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    onClick={() =>
                      setShowPassword(
                        (value) =>
                          !value,
                      )
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </label>

              {error && (
                <div className="login-error">
                  <strong>
                    No se pudo iniciar sesión
                  </strong>

                  <span>
                    {error}
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="login-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="login-spinner" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    Iniciar sesión
                  </>
                )}
              </button>
            </form>

            <div className="login-footer">
              <span>
                SalesIA Enterprise
              </span>

              <span>
                Sistema empresarial
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default LoginPage;
