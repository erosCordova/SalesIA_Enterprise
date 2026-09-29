import {
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserCog,
  UsersRound,
} from "lucide-react";

import ModulePage from "../../components/ui/ModulePage";

function AccessPage() {
  return (
    <ModulePage
      eyebrow="SEGURIDAD DEL SISTEMA"
      title="Acceso y seguridad"
      description="Administra usuarios, roles, permisos y mecanismos de acceso a SalesIA Enterprise."
      icon={ShieldCheck}
      features={[
        {
          title: "Usuarios",
          description:
            "Administración de las cuentas que utilizarán el sistema.",
          icon: UsersRound,
        },
        {
          title: "Roles",
          description:
            "Administrador, gerente, vendedor, analista y almacén.",
          icon: UserCog,
        },
        {
          title: "Permisos",
          description:
            "Control de acciones disponibles para cada rol.",
          icon: KeyRound,
        },
        {
          title: "Sesiones",
          description:
            "Control del acceso y cierre seguro de sesiones.",
          icon: LockKeyhole,
        },
      ]}
    />
  );
}

export default AccessPage;
