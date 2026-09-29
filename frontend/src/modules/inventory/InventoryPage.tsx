import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  History,
} from "lucide-react";

import ModulePage from "../../components/ui/ModulePage";

function InventoryPage() {
  return (
    <ModulePage
      eyebrow="CONTROL OPERATIVO"
      title="Gestión de inventario"
      description="Supervisa existencias, movimientos y disponibilidad de los productos de la empresa."
      icon={Boxes}
      features={[
        {
          title: "Stock actual",
          description:
            "Consulta las existencias disponibles de todos los productos.",
          icon: Boxes,
        },
        {
          title: "Entradas",
          description:
            "Registra incrementos de inventario y reposiciones.",
          icon: ArrowDownToLine,
        },
        {
          title: "Salidas",
          description:
            "Controla las disminuciones de stock y sus motivos.",
          icon: ArrowUpFromLine,
        },
        {
          title: "Alertas de stock",
          description:
            "Detecta productos por debajo del stock mínimo configurado.",
          icon: AlertTriangle,
        },
        {
          title: "Historial",
          description:
            "Consulta la trazabilidad completa de movimientos.",
          icon: History,
        },
      ]}
    />
  );
}

export default InventoryPage;
