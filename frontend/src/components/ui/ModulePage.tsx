import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
}

interface ModulePageProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  features: Feature[];
}

function ModulePage({
  eyebrow,
  title,
  description,
  icon: Icon,
  features,
}: ModulePageProps) {
  return (
    <section className="module-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <div className="module-main-icon">
          <Icon size={26} />
        </div>
      </div>

      <div className="module-feature-grid">
        {features.map((feature) => {
          const FeatureIcon = feature.icon;

          return (
            <article className="module-feature-card" key={feature.title}>
              <div className="module-feature-icon">
                <FeatureIcon size={21} />
              </div>

              <div className="module-feature-content">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>

              <button className="module-feature-action">
                <ArrowRight size={17} />
              </button>
            </article>
          );
        })}
      </div>

      <div className="module-development-notice">
        <div>
          <span>DISEÑO FUNCIONAL</span>
          <strong>Vista preparada para las siguientes fases</strong>
        </div>

        <p>
          En esta etapa definimos la experiencia visual. Los datos y operaciones
          reales se conectarán posteriormente con FastAPI y PostgreSQL.
        </p>
      </div>
    </section>
  );
}

export default ModulePage;
