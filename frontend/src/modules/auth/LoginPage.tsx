import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../../services/auth.service'

export default function LoginPage() {
    const navigate = useNavigate()

    const [dni, setDni] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        setError('')

        if (!dni.trim()) {
            setError('Ingrese su DNI')
            return
        }

        if (!password.trim()) {
            setError('Ingrese su contraseña')
            return
        }

        setLoading(true)

        try {
            await login({
                dni: dni.trim(),
                password,
            })

            navigate('/dashboard')
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'DNI o contraseña incorrectos'
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-page">
            <div className="login-container">

                {/* PANEL IZQUIERDO */}
                <section className="login-brand">
                    <div className="login-brand-content">

                        <div className="login-logo">
                            S
                        </div>

                        <h1>SalesIA Enterprise</h1>

                        <p>
                            Plataforma empresarial para la gestión
                            comercial, ventas y análisis de datos.
                        </p>

                        <div className="login-features">

                            <div className="login-feature">
                                <span className="login-feature-icon">
                                    ✓
                                </span>
                                Gestión empresarial
                            </div>

                            <div className="login-feature">
                                <span className="login-feature-icon">
                                    ✓
                                </span>
                                Control de ventas e inventario
                            </div>

                            <div className="login-feature">
                                <span className="login-feature-icon">
                                    ✓
                                </span>
                                Analytics y estadísticas
                            </div>

                        </div>
                    </div>
                </section>

                {/* FORMULARIO */}
                <section className="login-form-wrapper">

                    <form
                        className="login-form"
                        onSubmit={handleSubmit}
                    >

                        <div className="login-header">
                            <h2>Iniciar sesión</h2>

                            <p>
                                Ingresa tus credenciales para acceder al sistema.
                            </p>
                        </div>

                        {/* ERROR */}
                        {error && (
                            <div className="login-error">
                                {error}
                            </div>
                        )}

                        {/* DNI */}
                        <div className="login-field">
                            <label htmlFor="dni">
                                DNI
                            </label>

                            <div className="login-input-wrapper">
                                <input
                                    id="dni"
                                    name="dni"
                                    type="text"
                                    className="login-input"
                                    placeholder="Ingresa tu DNI"
                                    value={dni}
                                    onChange={(event) => setDni(event.target.value)}
                                    maxLength={8}
                                    autoComplete="username"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* CONTRASEÑA */}
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
                                    onChange={(event) => setPassword(event.target.value)}
                                    autoComplete="current-password"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* BOTÓN */}
                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading}
                        >
                            {loading ? 'Ingresando...' : 'Iniciar sesión'}
                        </button>

                        {/* FOOTER */}
                        <div className="login-footer">
                            SalesIA Enterprise
                        </div>

                    </form>

                </section>

            </div>
        </div>
    )
}