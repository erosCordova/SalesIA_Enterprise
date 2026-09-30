import {
  Building2,
  FileText,
  Settings,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import ModulePage from "../../components/ui/ModulePage";

function EmpresaPage() {
  return (
    <ModulePage
      eyebrow="CONFIGURACIÓN ORGANIZACIONAL"
      title="Empresa"
      description="Consulta la información principal y la configuración organizacional asociada a SalesIA Enterprise."
      icon={Building2}
      features={[
        {
          title: "Información empresarial",
          description:
            "Consulta los datos principales de la organización registrada.",
          icon: Building2,
        },
        {
          title: "Sucursales",
          description:
            "Administra los establecimientos asociados a la empresa.",
          icon: Building2,
          path: "/branches",
        },
        {
          title: "Usuarios",
          description:
            "Consulta la administración de cuentas y roles del sistema.",
          icon: UsersRound,
          path: "/access",
        },
        {
          title: "Reglas empresariales",
          description:
            "Centraliza configuraciones utilizadas por los procesos comerciales.",
          icon: Settings,
        },
        {
          title: "Documentación",
          description:
            "Mantiene información administrativa relevante de la empresa.",
          icon: FileText,
        },
        {
          title: "Seguridad",
          description:
            "Relaciona la configuración empresarial con los controles de acceso.",
          icon: ShieldCheck,
        },
      ]}
    />
  );
}

export default EmpresaPage;
