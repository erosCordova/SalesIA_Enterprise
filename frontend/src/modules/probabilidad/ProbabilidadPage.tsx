import {
  BrainCircuit,
  Calculator,
  Database,
  Percent,
  Sigma,
} from "lucide-react";

import ModulePage from "../../components/ui/ModulePage";

function ProbabilidadPage() {
  return (
    <ModulePage
      eyebrow="ANÁLISIS ESTADÍSTICO"
      title="Probabilidad"
      description="Aplica conceptos de probabilidad, variables aleatorias y Teorema de Bayes sobre información comercial."
      icon={Percent}
      features={[
        {
          title: "Eventos",
          description:
            "Define eventos comerciales que pueden analizarse mediante probabilidades.",
          icon: Percent,
        },
        {
          title: "Variables aleatorias",
          description:
            "Analiza cantidades y valores que dependen del resultado de una operación.",
          icon: Sigma,
        },
        {
          title: "Cálculo de probabilidades",
          description:
            "Obtiene resultados numéricos reproducibles a partir de los datos disponibles.",
          icon: Calculator,
        },
        {
          title: "Teorema de Bayes",
          description:
            "Actualiza probabilidades utilizando evidencia observada en los datos.",
          icon: BrainCircuit,
        },
        {
          title: "Datos de análisis",
          description:
            "Relaciona los cálculos con datasets y observaciones almacenadas.",
          icon: Database,
          path: "/analytics",
        },
      ]}
    />
  );
}

export default ProbabilidadPage;
