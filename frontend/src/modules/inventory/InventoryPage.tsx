import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  History,
  PackageSearch,
} from "lucide-react";

import ModulePage from "../../components/ui/ModulePage";

function InventoryPage() {
  return (
    <ModulePage
      eyebrow="CONTROL OPERATIVO"
      title="Gestión de inventario"
      description="Supervisa existencias, movimientos y disponibilidad de los productos de SalesIA Enterprise."
      icon={Boxes}
      features={[
        {
          title: "Stock actual",
          description:
            "Consulta las existencias disponibles y el nivel actual de cada producto.",
          icon: Boxes,
        },
        {
          title: "Entradas",
          description:
            "Registra reposiciones e incrementos de inventario.",
          icon: ArrowDownToLine,
        },
        {
          title: "Salidas",
          description:
            "Controla las disminuciones de stock generadas por ventas y movimientos.",
          icon: ArrowUpFromLine,
        },
        {
          title: "Alertas de stock",
          description:
            "Identifica productos por debajo del nivel mínimo configurado.",
          icon: AlertTriangle,
        },
        {
          title: "Productos",
          description:
            "Consulta la información comercial de los productos almacenados.",
          icon: PackageSearch,
          path: "/products",
        },
        {
          title: "Historial de movimientos",
          description:
            "Consulta la trazabilidad de entradas, salidas y modificaciones.",
          icon: History,
        },
      ]}
    />
  );
}

export default InventoryPage;
