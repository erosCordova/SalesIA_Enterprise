import {
  Calculator,
  CreditCard,
  History,
  ReceiptText,
  ShoppingCart,
  UserRound,
} from "lucide-react";

import ModulePage from "../../components/ui/ModulePage";

function VentasPage() {
  return (
    <ModulePage
      eyebrow="OPERACIÓN COMERCIAL"
      title="Ventas"
      description="Registra y consulta las operaciones comerciales realizadas por SalesIA Enterprise."
      icon={ShoppingCart}
      features={[
        {
          title: "Nueva venta",
          description:
            "Inicia una operación comercial con cliente, productos y condiciones de venta.",
          icon: ShoppingCart,
          path: "/sales/new",
        },
        {
          title: "Detalle de venta",
          description:
            "Consulta productos, cantidades, precios y totales asociados.",
          icon: ReceiptText,
        },
        {
          title: "Cálculos comerciales",
          description:
            "Gestiona subtotal, descuentos, impuestos y total de la operación.",
          icon: Calculator,
        },
        {
          title: "Pagos",
          description:
            "Consulta el estado y medio de pago de cada operación comercial.",
          icon: CreditCard,
        },
        {
          title: "Vendedor",
          description:
            "Relaciona cada venta con el usuario responsable de la operación.",
          icon: UserRound,
        },
        {
          title: "Historial",
          description:
            "Consulta operaciones realizadas anteriormente y su trazabilidad.",
          icon: History,
        },
      ]}
    />
  );
}

export default VentasPage;
