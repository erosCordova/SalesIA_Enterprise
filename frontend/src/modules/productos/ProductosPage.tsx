import {
  Boxes,
  CircleDollarSign,
  History,
  PackageSearch,
  Search,
  Tags,
} from "lucide-react";

import ModulePage from "../../components/ui/ModulePage";

function ProductosPage() {
  return (
    <ModulePage
      eyebrow="CATÁLOGO COMERCIAL"
      title="Productos"
      description="Administra el catálogo de productos utilizados en ventas e inventario."
      icon={PackageSearch}
      features={[
        {
          title: "Catálogo de productos",
          description:
            "Consulta los productos registrados y su información comercial.",
          icon: PackageSearch,
        },
        {
          title: "Categorías",
          description:
            "Organiza los productos según su categoría comercial.",
          icon: Tags,
          path: "/categories",
        },
        {
          title: "Precios",
          description:
            "Gestiona los valores comerciales asociados a cada producto.",
          icon: CircleDollarSign,
        },
        {
          title: "Disponibilidad",
          description:
            "Consulta la relación entre producto y existencias disponibles.",
          icon: Boxes,
          path: "/inventory",
        },
        {
          title: "Búsqueda y filtros",
          description:
            "Localiza productos mediante código, nombre, categoría y estado.",
          icon: Search,
        },
        {
          title: "Historial",
          description:
            "Consulta cambios relevantes efectuados sobre cada producto.",
          icon: History,
        },
      ]}
    />
  );
}

export default ProductosPage;
