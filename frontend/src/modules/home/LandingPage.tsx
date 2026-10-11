import {
  ArrowRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  LockKeyhole,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  UsersRound,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import "../home/lading.css";

// 1. IMPORTA TU LOGO AQUÍ
import logoImg from "../../../assets/logo.png"; // <- Cambia por el nombre/ruta de tu imagen

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">

      {/* NAVBAR */}
      <header className="landing-navbar">
        {/* LOGO EN EL NAVBAR */}
        <div className="landing-logo">
          <img src={logoImg} alt="SalesIA Enterprise Logo" className="landing-logo-img" />
        </div>

        <nav className="landing-nav">
          <a href="#inicio">Inicio</a>
          <a href="#soluciones">Soluciones</a>
          <a href="#beneficios">Beneficios</a>
          <a href="#seguridad">Seguridad</a>
        </nav>

        <button
          className="landing-login-button"
          onClick={() => navigate("/login")}
        >
          Iniciar sesión
          <ArrowRight size={17} />
        </button>
      </header>

      {/* HERO */}
      <main>
        <section id="inicio" className="landing-hero">
          <div className="landing-hero-content">
            <div className="landing-badge">
              <Sparkles size={15} />
              PLATAFORMA EMPRESARIAL INTELIGENTE
            </div>

            <h1>
              Gestiona tu empresa
              <span> de forma inteligente.</span>
            </h1>

            <p>
              SalesIA Enterprise centraliza ventas, inventario,
              clientes, análisis y reportes en una sola plataforma
              diseñada para mejorar la gestión empresarial.
            </p>

            <div className="landing-hero-actions">
              <button
                className="landing-primary-button"
                onClick={() => navigate("/login")}
              >
                Comenzar ahora
                <ArrowRight size={19} />
              </button>

              <a href="#soluciones" className="landing-secondary-button">
                Conocer soluciones
              </a>
            </div>

            <div className="landing-trust">
              <div>
                <CheckCircle2 size={17} />
                Gestión centralizada
              </div>
              <div>
                <CheckCircle2 size={17} />
                Acceso multirrol
              </div>
              <div>
                <CheckCircle2 size={17} />
                Auditoría empresarial
              </div>
            </div>
          </div>

          {/* DASHBOARD VISUAL */}
          <div className="landing-dashboard">
            <div className="landing-dashboard-header">
              <div>
                <span>RESUMEN EMPRESARIAL</span>
                <strong>Dashboard</strong>
              </div>

              <div className="landing-dashboard-status">
                <span />
                Sistema activo
              </div>
            </div>

            <div className="landing-stats">
              <div className="landing-stat-card">
                <div className="landing-stat-icon">
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <span>Ventas</span>
                  <strong>S/ 48,920</strong>
                </div>
                <small>+18.4%</small>
              </div>

              <div className="landing-stat-card">
                <div className="landing-stat-icon">
                  <Boxes size={20} />
                </div>
                <div>
                  <span>Inventario</span>
                  <strong>1,284</strong>
                </div>
                <small>+8.2%</small>
              </div>

              <div className="landing-stat-card">
                <div className="landing-stat-icon">
                  <UsersRound size={20} />
                </div>
                <div>
                  <span>Clientes</span>
                  <strong>846</strong>
                </div>
                <small>+12.6%</small>
              </div>
            </div>

            <div className="landing-chart-card">
              <div className="landing-chart-header">
                <div>
                  <span>RENDIMIENTO</span>
                  <strong>Ventas mensuales</strong>
                </div>
                <TrendingUp size={21} />
              </div>

              <div className="landing-chart">
                <div className="chart-line chart-line-1" />
                <div className="chart-line chart-line-2" />
                <div className="chart-line chart-line-3" />
                <div className="chart-line chart-line-4" />

                <div className="chart-bars">
                  <span style={{ height: "35%" }} />
                  <span style={{ height: "48%" }} />
                  <span style={{ height: "42%" }} />
                  <span style={{ height: "62%" }} />
                  <span style={{ height: "56%" }} />
                  <span style={{ height: "76%" }} />
                  <span style={{ height: "88%" }} />
                  <span style={{ height: "70%" }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SOLUCIONES */}
        <section id="soluciones" className="landing-section">
          <div className="landing-section-heading">
            <span>SOLUCIONES</span>
            <h2>
              Todo lo que necesitas
              <br />
              en un solo lugar.
            </h2>
            <p>
              Herramientas diseñadas para facilitar las operaciones
              diarias de tu empresa.
            </p>
          </div>

          <div className="landing-solutions-grid">
            <article className="landing-solution-card">
              <div className="solution-icon">
                <ShoppingCart size={25} />
              </div>
              <h3>Ventas</h3>
              <p>
                Administra ventas, clientes, cotizaciones y
                operaciones comerciales desde una interfaz centralizada.
              </p>
              <a href="/sales">
                Ver módulo
                <ArrowRight size={16} />
              </a>
            </article>

            <article className="landing-solution-card">
              <div className="solution-icon">
                <Boxes size={25} />
              </div>
              <h3>Inventario</h3>
              <p>
                Controla productos, stock, movimientos y
                disponibilidad de tus almacenes.
              </p>
              <a href="/products">
                Ver módulo
                <ArrowRight size={16} />
              </a>
            </article>

            <article className="landing-solution-card">
              <div className="solution-icon">
                <UsersRound size={25} />
              </div>
              <h3>Clientes</h3>
              <p>
                Mantén organizada la información de tus clientes
                y consulta su actividad comercial.
              </p>
              <a href="/clients">
                Ver módulo
                <ArrowRight size={16} />
              </a>
            </article>

            <article className="landing-solution-card">
              <div className="solution-icon">
                <BarChart3 size={25} />
              </div>
              <h3>Reportes y análisis</h3>
              <p>
                Convierte los datos de tu empresa en información
                útil para tomar mejores decisiones.
              </p>
              <a href="/dashboard">
                Ver dashboard
                <ArrowRight size={16} />
              </a>
            </article>
          </div>
        </section>

        {/* BENEFICIOS */}
        <section id="beneficios" className="landing-benefits">
          <div className="landing-benefits-content">
            <span className="landing-section-label">¿POR QUÉ SALESIA?</span>
            <h2>
              Una plataforma pensada
              <br />
              para crecer contigo.
            </h2>
            <p>
              Simplifica tus procesos empresariales y obtén una
              visión completa de tu negocio.
            </p>

            <div className="landing-benefit-list">
              <div>
                <CheckCircle2 size={20} />
                <span>Información empresarial centralizada</span>
              </div>
              <div>
                <CheckCircle2 size={20} />
                <span>Acceso según el rol de cada usuario</span>
              </div>
              <div>
                <CheckCircle2 size={20} />
                <span>Reportes y métricas en tiempo real</span>
              </div>
              <div>
                <CheckCircle2 size={20} />
                <span>Gestión de ventas e inventario</span>
              </div>
            </div>
          </div>

          <div className="landing-benefit-visual">
            <div className="benefit-circle">
              <ShieldCheck size={62} />
            </div>
            <div className="benefit-floating-card">
              <LockKeyhole size={20} />
              <div>
                <strong>Acceso protegido</strong>
                <span>Autenticación empresarial</span>
              </div>
            </div>
          </div>
        </section>

        {/* SEGURIDAD */}
        <section id="seguridad" className="landing-security-section">
          <div className="landing-security-icon">
            <ShieldCheck size={30} />
          </div>
          <span>SEGURIDAD EMPRESARIAL</span>
          <h2>
            Tus datos,
            <br />
            protegidos.
          </h2>
          <p>
            SalesIA utiliza autenticación y control de acceso
            basado en roles para mantener protegida la información
            de tu empresa.
          </p>
          <button
            className="landing-primary-button"
            onClick={() => navigate("/login")}
          >
            Acceder al sistema
            <ArrowRight size={18} />
          </button>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="landing-footer">
        {/* LOGO EN EL FOOTER */}
        <div className="landing-logo">
          <img src={logoImg} alt="SalesIA Enterprise Logo" className="landing-logo-img" />
        </div>

        <p>© 2026 SalesIA Enterprise. Plataforma de gestión empresarial.</p>

        <div>
          <span>Seguridad</span>
          <span>Privacidad</span>
          <span>Soporte</span>
        </div>
      </footer>

    </div>
  );
}