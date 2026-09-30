import {
  BarChart3,
  Database,
  History,
  Lightbulb,
  SearchCheck,
  TrendingUp,
} from "lucide-react";

import ModulePage from "../../components/ui/ModulePage";

function InsightsPage() {
  return (
    <ModulePage
      eyebrow="INTELIGENCIA EMPRESARIAL"
      title="Insights"
      description="Presenta observaciones explicables generadas a partir de resultados estadísticos y comportamiento comercial."
      icon={Lightbulb}
      features={[
        {
          title: "Observaciones empresariales",
          description:
            "Presenta conclusiones derivadas de reglas y resultados cuantitativos.",
          icon: Lightbulb,
        },
        {
          title: "Evidencia numérica",
          description:
            "Muestra las métricas que sustentan cada observación presentada.",
          icon: BarChart3,
          path: "/analytics",
        },
        {
          title: "Patrones comerciales",
          description:
            "Identifica comportamientos relevantes dentro de los datos empresariales.",
          icon: TrendingUp,
        },
        {
          title: "Origen del análisis",
          description:
            "Relaciona cada insight con el dataset y cálculo que lo generó.",
          icon: Database,
        },
        {
          title: "Explicación",
          description:
            "Permite comprender qué información dio origen a la observación.",
          icon: SearchCheck,
        },
        {
          title: "Historial",
          description:
            "Consulta insights generados anteriormente y sus resultados asociados.",
          icon: History,
        },
      ]}
    />
  );
}

export default InsightsPage;
