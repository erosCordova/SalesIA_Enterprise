import {
  Boxes,
  CreditCard,
  PackageSearch,
  Percent,
  ReceiptText,
  ShoppingCart,
  UserRound,
} from "lucide-react";

import ModulePage from "../../components/ui/ModulePage";

function NuevaVentaPage() {
  return (
    <ModulePage
      eyebrow="REGISTRO DE OPERACIÓN"
      title="Nueva venta"
      description="Prepara una nueva operación comercial siguiendo el flujo cliente, productos, cálculo, pago e inventario."
      icon={ShoppingCart}
      features={[
        {
          title: "Seleccionar cliente",
          description:
            "Asocia la operación comercial con un cliente registrado.",
          icon: UserRound,
          path: "/commercial",
        },
        {
          title: "Agregar productos",
          description:
            "Selecciona productos y cantidades para formar el detalle de venta.",
          icon: PackageSearch,
          path: "/products",
        },
        {
          title: "Carrito de venta",
          description:
            "Revisa los productos incluidos antes de registrar la operación.",
          icon: ShoppingCart,
        },
        {
          title: "Descuentos e impuestos",
          description:
            "Aplica las reglas comerciales definidas para calcular el total.",
          icon: Percent,
        },
        {
          title: "Resumen",
          description:
            "Comprueba subtotal, descuento, impuestos y monto final.",
          icon: ReceiptText,
        },
        {
          title: "Registrar pago",
          description:
            "Completa la operación con la información del pago correspondiente.",
          icon: CreditCard,
        },
        {
          title: "Actualización de stock",
          description:
            "La venta se relacionará con el movimiento correspondiente de inventario.",
          icon: Boxes,
          path: "/inventory",
        },
      ]}
    />
  );
}

export default NuevaVentaPage;
