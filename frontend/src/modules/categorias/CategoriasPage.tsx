import {
  CheckCircle2,
  PackageSearch,
  Search,
  Tags,
} from "lucide-react";

import ModulePage from "../../components/ui/ModulePage";

function CategoriasPage() {
  return (
    <ModulePage
      eyebrow="ORGANIZACIÓN DEL CATÁLOGO"
      title="Categorías"
      description="Organiza y clasifica los productos para facilitar su administración y análisis comercial."
      icon={Tags}
      features={[
        {
          title: "Categorías registradas",
          description:
            "Consulta las categorías existentes dentro del catálogo empresarial.",
          icon: Tags,
        },
        {
          title: "Productos asociados",
          description:
            "Consulta los productos relacionados con cada categoría.",
          icon: PackageSearch,
          path: "/products",
        },
        {
          title: "Búsqueda",
          description:
            "Localiza rápidamente categorías mediante nombre y descripción.",
          icon: Search,
        },
        {
          title: "Estado",
          description:
            "Controla qué categorías se encuentran disponibles para uso comercial.",
          icon: CheckCircle2,
        },
      ]}
    />
  );
}

export default CategoriasPage;
