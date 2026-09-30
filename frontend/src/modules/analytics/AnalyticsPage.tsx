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
      description="Convierte los datos comerciales en estadísticas, probabilidades, indicadores e información útil para la toma de decisiones."
      icon={BrainCircuit}
      features={[
        {
          title: "Resumen analítico",
          description:
            "Indicadores generales de ventas, ingresos, transacciones y clientes.",
          icon: ChartNoAxesCombined,
        },
        {
          title: "Ventas",
          description:
            "Analiza evolución temporal, ticket promedio, media y mediana.",
          icon: BarChart3,
          path: "/sales",
        },
        {
          title: "Productos",
          description:
            "Estudia cantidades vendidas, ingresos y participación comercial.",
          icon: PackageSearch,
          path: "/products",
        },
        {
          title: "Clientes",
          description:
            "Analiza frecuencia, compras y comportamiento de los clientes.",
          icon: ContactRound,
          path: "/commercial",
        },
        {
          title: "Vendedores",
          description:
            "Compara ventas, ingresos y promedios obtenidos por vendedor.",
          icon: UsersRound,
        },
        {
          title: "Variables estadísticas",
          description:
            "Clasifica y analiza las variables generadas por la operación comercial.",
          icon: Sigma,
        },
        {
          title: "Probabilidad",
          description:
            "Trabaja eventos, variables aleatorias, probabilidades y Teorema de Bayes.",
          icon: Percent,
          path: "/probability",
        },
        {
          title: "Insights",
          description:
            "Consulta observaciones empresariales respaldadas por resultados numéricos.",
          icon: Lightbulb,
          path: "/insights",
        },
      ]}
    />
  );
}

export default AnalyticsPage;
