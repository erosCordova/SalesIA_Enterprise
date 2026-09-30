import {
  Boxes,
  Building2,
  MapPin,
  ShoppingCart,
  UsersRound,
} from "lucide-react";

import ModulePage from "../../components/ui/ModulePage";

function SucursalesPage() {
  return (
    <ModulePage
      eyebrow="ESTRUCTURA ORGANIZACIONAL"
      title="Sucursales"
      description="Administra los establecimientos y puntos operativos vinculados con la empresa."
      icon={Building2}
      features={[
        {
          title: "Sucursales registradas",
          description:
            "Consulta los establecimientos asociados a SalesIA Enterprise.",
          icon: Building2,
        },
        {
          title: "Ubicación",
          description:
            "Mantiene la información geográfica y dirección de cada sucursal.",
          icon: MapPin,
        },
        {
          title: "Ventas por sucursal",
          description:
            "Relaciona las operaciones comerciales con el establecimiento correspondiente.",
          icon: ShoppingCart,
          path: "/sales",
        },
        {
          title: "Inventario",
          description:
            "Permite asociar existencias y movimientos con una sucursal.",
          icon: Boxes,
          path: "/inventory",
        },
        {
          title: "Personal",
          description:
            "Relaciona usuarios y responsables con las operaciones de cada sede.",
          icon: UsersRound,
        },
      ]}
    />
  );
}

export default SucursalesPage;
