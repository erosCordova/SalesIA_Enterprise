import {
  useState,
  type FormEvent,
} from "react";

import {
  BarChart3,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { login } from "../../services/auth.service";

import "./login.css";


export default function LoginPage() {
  const navigate = useNavigate();

  const [dni, setDni] = useState("");
  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (!/^\d{8}$/.test(dni)) {
      setError(
        "El DNI debe contener exactamente 8 números.",
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "La contraseña debe tener al menos 8 caracteres.",
      );
      return;
    }

    setLoading(true);

    try {
      await login({
        dni,
        password,
      });

      navigate(
        "/dashboard",
        {
          replace: true,
        },
      );
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "DNI o contraseña incorrectos.",
      );
    } finally {
      setLoading(false);
    }
  }


  function handleDniChange(
    value: string,
  ) {
    const onlyNumbers = value
      .replace(/\D/g, "")
      .slice(0, 8);

    setDni(onlyNumbers);
  }


  return (
    <div className="login-page">
      <div className="login-container">
        <section className="login-brand">
          <div className="login-brand-content">
            <div className="login-logo">
              <BarChart3 size={34} />
            </div>

            <h1>
              SalesIA Enterprise
            </h1>

            <p>
              Plataforma empresarial para
              gestionar ventas, inventario y
              análisis de datos.
            </p>

            <div className="login-features">
              <div className="login-feature">
                <span className="login-feature-icon">
                  <ShieldCheck size={18} />
                </span>

                Acceso seguro por roles
              </div>

              <div className="login-feature">
                <span className="login-feature-icon">
                  <UserRound size={18} />
                </span>

                Usuarios administrados por la empresa
              </div>

              <div className="login-feature">
                <span className="login-feature-icon">
                  <BarChart3 size={18} />
                </span>

                Analytics y estadísticas
              </div>
            </div>
          </div>
        </section>

        <section className="login-form-wrapper">
          <form
            className="login-form"
            onSubmit={handleSubmit}
          >
            <div className="login-header">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "8px",
                }}
              >
                <LockKeyhole size={24} />

                <h2>
                  Iniciar sesión
                </h2>
              </div>

              <p>
                Ingresa el DNI y la contraseña
                asignados por el administrador.
              </p>
            </div>

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            <div className="login-field">
              <label htmlFor="dni">
                DNI
              </label>

              <div className="login-input-wrapper">
                <input
                  id="dni"
                  name="dni"
                  type="text"
                  inputMode="numeric"
                  className="login-input"
                  placeholder="Ej. 87654321"
                  value={dni}
                  onChange={(event) =>
                    handleDniChange(
                      event.target.value,
                    )
                  }
                  maxLength={8}
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password">
                Contraseña
              </label>

              <div className="login-input-wrapper">
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="login-input"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value,
                    )
                  }
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading
                ? "Ingresando..."
                : "Iniciar sesión"}
            </button>

            <div className="login-footer">
              SalesIA Enterprise · 2026
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
