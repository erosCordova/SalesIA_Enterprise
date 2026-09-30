import {
  Clock3,
  FileClock,
  SearchCheck,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";

import ModulePage from "../../components/ui/ModulePage";

function AuditPage() {
  return (
    <ModulePage
      eyebrow="CONTROL Y TRAZABILIDAD"
      title="Auditoría"
      description="Mantiene evidencia de las operaciones críticas realizadas dentro de SalesIA Enterprise."
      icon={ShieldCheck}
      features={[
        {
          title: "Acciones de usuarios",
          description:
            "Identifica qué usuario realizó cada operación relevante.",
          icon: UserRoundCheck,
        },
        {
          title: "Historial de cambios",
          description:
            "Registra modificaciones realizadas sobre información crítica.",
          icon: FileClock,
        },
        {
          title: "Fecha y hora",
          description:
            "Conserva trazabilidad temporal para los eventos registrados.",
          icon: Clock3,
        },
        {
          title: "Consulta de auditoría",
          description:
            "Permite localizar eventos mediante criterios de búsqueda.",
          icon: SearchCheck,
        },
      ]}
    />
  );
}

export default AuditPage;
