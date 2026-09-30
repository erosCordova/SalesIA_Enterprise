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
      description="Consulta y prepara información comercial y estadística para presentación, análisis y toma de decisiones."
      icon={FileText}
      features={[
        {
          title: "Reporte de ventas",
          description:
            "Consulta operaciones comerciales por periodo, estado y responsable.",
          icon: ShoppingBag,
          path: "/sales",
        },
        {
          title: "Reporte estadístico",
          description:
            "Presenta resultados obtenidos desde el módulo Analytics.",
          icon: BarChart3,
          path: "/analytics",
        },
        {
          title: "Reporte de productos",
          description:
            "Consulta información comercial y comportamiento de productos.",
          icon: PackageSearch,
          path: "/products",
        },
        {
          title: "Reporte de clientes",
          description:
            "Consulta actividad e historial comercial de los clientes.",
          icon: ContactRound,
          path: "/commercial",
        },
        {
          title: "Reporte de vendedores",
          description:
            "Presenta indicadores asociados al rendimiento comercial.",
          icon: UsersRound,
        },
        {
          title: "Exportación",
          description:
            "Prepara información para descarga y distribución.",
          icon: FileDown,
        },
        {
          title: "Vista imprimible",
          description:
            "Genera una presentación preparada para impresión.",
          icon: Printer,
        },
      ]}
    />
  );
}

export default ReportsPage;
