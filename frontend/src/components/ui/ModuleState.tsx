import {
  AlertCircle,
  CheckCircle2,
  Database,
  LoaderCircle,
} from "lucide-react";

type StateType = "loading" | "empty" | "error" | "success";

interface ModuleStateProps {
  type: StateType;
  title?: string;
  description?: string;
}

const stateConfig = {
  loading: {
    icon: LoaderCircle,
    title: "Cargando información",
    description: "Estamos obteniendo los datos solicitados.",
  },
  empty: {
    icon: Database,
    title: "Sin información",
    description: "Todavía no existen registros para mostrar.",
  },
  error: {
    icon: AlertCircle,
    title: "No se pudo cargar",
    description: "Ocurrió un problema al obtener la información.",
  },
  success: {
    icon: CheckCircle2,
    title: "Operación completada",
    description: "La información se procesó correctamente.",
  },
};

function ModuleState({
  type,
  title,
  description,
}: ModuleStateProps) {
  const config = stateConfig[type];
  const Icon = config.icon;

  return (
    <div className={`module-state state-${type}`}>
      <div className="module-state-icon">
        <Icon
          size={24}
          className={type === "loading" ? "state-spinner" : ""}
        />
      </div>

      <div>
        <strong>{title ?? config.title}</strong>
        <p>{description ?? config.description}</p>
      </div>
    </div>
  );
}

export default ModuleState;
