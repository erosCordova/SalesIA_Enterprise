import {
  BarChart3,
  BrainCircuit,
  ChartNoAxesCombined,
  ContactRound,
  Lightbulb,
  PackageSearch,
  Percent,
  Sigma,
  UsersRound,
} from "lucide-react";

import ModulePage from "../../components/ui/ModulePage";

function AnalyticsPage() {
  return (
    <ModulePage
      eyebrow="INTELIGENCIA COMERCIAL"
      title="Analytics"
      description="Transforma los datos generados por las operaciones comerciales en estadísticas, probabilidades, gráficos e insights."
      icon={BrainCircuit}
      features={[
        {
          title: "Resumen",
          description:
            "Indicadores generales de ventas, ingresos, transacciones y clientes.",
          icon: ChartNoAxesCombined,
        },
        {
          title: "Ventas",
          description:
            "Evolución temporal, ticket promedio, media y mediana.",
          icon: BarChart3,
        },
        {
          title: "Productos",
          description:
            "Cantidad vendida, ingresos y participación comercial.",
          icon: PackageSearch,
        },
        {
          title: "Clientes",
          description:
            "Compras, frecuencia y comportamiento comercial.",
          icon: ContactRound,
        },
        {
          title: "Vendedores",
          description:
            "Ventas, ingresos y promedios por vendedor.",
          icon: UsersRound,
        },
        {
          title: "Variables",
          description:
            "Clasificación, distribución y estadísticas de variables.",
          icon: Sigma,
        },
        {
          title: "Probabilidad",
          description:
            "Eventos, probabilidades y aplicación del Teorema de Bayes.",
          icon: Percent,
        },
        {
          title: "Insights",
          description:
            "Observaciones explicables generadas desde resultados numéricos.",
          icon: Lightbulb,
        },
      ]}
    />
  );
}

export default AnalyticsPage;
