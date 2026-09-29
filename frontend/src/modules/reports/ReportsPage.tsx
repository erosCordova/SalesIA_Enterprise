import {
  BarChart3,
  ContactRound,
  FileDown,
  FileText,
  PackageSearch,
  Printer,
  ShoppingBag,
  UsersRound,
} from "lucide-react";

import ModulePage from "../../components/ui/ModulePage";

function ReportsPage() {
  return (
    <ModulePage
      eyebrow="INFORMACIÓN EMPRESARIAL"
      title="Reportes"
      description="Consulta, filtra y prepara información comercial y estadística para la toma de decisiones."
      icon={FileText}
      features={[
        {
          title: "Ventas",
          description:
            "Reporte detallado de ventas por periodo y estado.",
          icon: ShoppingBag,
        },
        {
          title: "Estadística",
          description:
            "Resultados de análisis estadísticos realizados por SalesIA.",
          icon: BarChart3,
        },
        {
          title: "Productos",
          description:
            "Información comercial y comportamiento de productos.",
          icon: PackageSearch,
        },
        {
          title: "Clientes",
          description:
            "Actividad e historial comercial de clientes.",
          icon: ContactRound,
        },
        {
          title: "Vendedores",
          description:
            "Rendimiento comercial por vendedor.",
          icon: UsersRound,
        },
        {
          title: "Exportación",
          description:
            "Preparación de información para descarga y distribución.",
          icon: FileDown,
        },
        {
          title: "Vista imprimible",
          description:
            "Formato optimizado para impresión de documentos.",
          icon: Printer,
        },
      ]}
    />
  );
}

export default ReportsPage;
