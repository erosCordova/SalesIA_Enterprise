import type { LucideIcon } from "lucide-react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
  path?: string;
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
  const navigate = useNavigate();

  return (
    <section className="module-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">
            {eyebrow}
          </span>

          <h1>
            {title}
          </h1>

          <p>
            {description}
          </p>
        </div>

        <div className="module-main-icon">
          <Icon size={26} />
        </div>
      </div>

      <div className="module-feature-grid">
        {features.map((feature) => {
          const FeatureIcon = feature.icon;

          return (
            <article
              className="module-feature-card"
              key={feature.title}
            >
              <div className="module-feature-icon">
                <FeatureIcon size={20} />
              </div>

              <div className="module-feature-content">
                <h3>
                  {feature.title}
                </h3>

                <p>
                  {feature.description}
                </p>
              </div>

              {feature.path && (
                <button
                  type="button"
                  className="module-feature-action"
                  title={`Abrir ${feature.title}`}
                  onClick={() =>
                    navigate(feature.path!)
                  }
                >
                  <ArrowRight size={16} />
                </button>
              )}
            </article>
          );
        })}
      </div>

      <div className="module-development-notice">
        <div>
          <span>
            ARQUITECTURA MODULAR
          </span>

          <strong>
            Interfaz preparada para integración empresarial
          </strong>
        </div>

        <p>
          La estructura visual está preparada para consumir
          progresivamente los servicios de FastAPI y los datos
          almacenados en PostgreSQL.
        </p>

        <CheckCircle2
          size={21}
          style={{
            flexShrink: 0,
            color: "#0891B2",
          }}
        />
      </div>
    </section>
  );
}

export default ModulePage;
