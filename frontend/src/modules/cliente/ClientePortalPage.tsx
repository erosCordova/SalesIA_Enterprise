import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  Download,
  CheckCircle2,
  ChevronRight,
  Home,
  LogOut,
  LockKeyhole,
  Mail,
  MapPin,
  Menu,
  Pencil,
  Phone,
  Printer,
  ReceiptText,
  RefreshCw,
  Save,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../services/auth.context";

import {
  changeCustomerPassword,
  getCustomerPortal,
  updateCustomerProfile,
} from "../../services/customer-accounts.service";

import type {
  CustomerPortalResponse,
  CustomerPortalSale,
} from "../../services/customer-accounts.service";

import "./cliente-portal.css";


type PortalSection =
  | "inicio"
  | "compras"
  | "perfil"
  | "seguridad";


function numericValue(
  value:
    | number
    | string
    | null
    | undefined,
) {
  const result =
    Number(
      value ?? 0,
    );

  return Number.isFinite(
    result,
  )
    ? result
    : 0;
}


function formatMoney(
  value:
    | number
    | string
    | null
    | undefined,
) {
  const amount =
    Number(
      value ?? 0,
    );

  return new Intl.NumberFormat(
    "es-PE",
    {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    },
  ).format(
    Number.isFinite(amount)
      ? amount
      : 0,
  );
}


function formatDate(
  value?: string | null,
) {
  if (!value) {
    return "Sin registro";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "es-PE",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}


export default function ClientePortalPage() {
  const navigate =
    useNavigate();

  const {
    user,
    logout,
  } = useAuth();


  const [
    section,
    setSection,
  ] =
    useState<PortalSection>(
      "inicio",
    );


  const [
    sidebarOpen,
    setSidebarOpen,
  ] =
    useState(false);


  const [
    data,
    setData,
  ] =
    useState<CustomerPortalResponse | null>(
      null,
    );


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    success,
    setSuccess,
  ] =
    useState("");


  const [
    search,
    setSearch,
  ] =
    useState("");


  const [
    editing,
    setEditing,
  ] =
    useState(false);


  const [
    saving,
    setSaving,
  ] =
    useState(false);


  const [
    selectedSale,
    setSelectedSale,
  ] =
    useState<CustomerPortalSale | null>(
      null,
    );


  const [
    form,
    setForm,
  ] =
    useState({
      email: "",
      phone: "",
      address: "",
      city: "",
    });


  const [
    passwordForm,
    setPasswordForm,
  ] =
    useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });


  const [
    changingPassword,
    setChangingPassword,
  ] =
    useState(false);


  const loadPortal =
    useCallback(
      async (
        refresh = false,
      ) => {
        try {
          if (refresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError("");

          const result =
            await getCustomerPortal();

          setData(
            result,
          );

          setForm({
            email:
              result.customer.email
              ?? "",

            phone:
              result.customer.phone
              ?? "",

            address:
              result.customer.address
              ?? "",

            city:
              result.customer.city
              ?? "",
          });
        } catch (
          currentError
        ) {
          setError(
            currentError
              instanceof Error
              ? currentError.message
              : "No se pudo cargar la información de tu cuenta.",
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );


  useEffect(
    () => {
      void loadPortal();
    },
    [
      loadPortal,
    ],
  );


  const customer =
    data?.customer;


  const sales =
    data?.sales
    ?? [];


  const customerName =
    (
      customer?.business_name
      ||
      [
        customer?.first_name,
        customer?.last_name,
      ]
        .filter(Boolean)
        .join(" ")
      ||
      (
        user
          ? `${user.first_name} ${user.last_name}`
          : ""
      )
      ||
      "Cliente"
    ).trim();


  const nameParts =
    customerName
      .split(/\s+/)
      .filter(Boolean);


  const initials =
    (
      (
        nameParts[0]
          ?.charAt(0)
        ?? "C"
      )
      +
      (
        nameParts.length > 1
          ? nameParts[
              nameParts.length - 1
            ].charAt(0)
          : ""
      )
    ).toUpperCase();


  const totalPurchased =
    useMemo(
      () =>
        sales.reduce(
          (
            accumulator,
            sale,
          ) =>
            accumulator
            +
            Number(
              sale.total
              ?? 0,
            ),
          0,
        ),
      [
        sales,
      ],
    );


  const filteredSales =
    useMemo(
      () => {
        const term =
          search
            .trim()
            .toLowerCase();

        if (!term) {
          return sales;
        }

        return sales.filter(
          (
            sale,
          ) =>
            [
              sale.sale_number,
              sale.status,
              sale.sale_date,
              sale.total,
            ].some(
              (
                value,
              ) =>
                String(
                  value
                  ?? "",
                )
                  .toLowerCase()
                  .includes(
                    term,
                  ),
            ),
        );
      },
      [
        sales,
        search,
      ],
    );


  const recentSales =
    sales.slice(
      0,
      4,
    );


  const lastSale =
    sales.length > 0
      ? sales[0]
      : null;


  const sectionName =
    section === "inicio"
      ? "Inicio"
      : section === "compras"
        ? "Mis compras"
        : section === "perfil"
          ? "Mi perfil"
          : "Seguridad";


  function changeSection(
    next:
      PortalSection,
  ) {
    setSection(
      next,
    );

    setSidebarOpen(
      false,
    );

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  async function createPurchaseDocument(
    sale: CustomerPortalSale,
  ) {
    const {
      default: jsPDF,
    } = await import(
      "jspdf"
    );

    const pdf =
      new jsPDF({
        orientation:
          "portrait",

        unit:
          "mm",

        format:
          "a4",

        compress:
          true,
      });


    const pageWidth =
      pdf.internal.pageSize.getWidth();

    const pageHeight =
      pdf.internal.pageSize.getHeight();

    const margin = 16;

    const contentWidth =
      pageWidth
      - margin * 2;

    let y = 18;


    function drawHeader(
      continuation = false,
    ) {
      pdf.setFillColor(
        15,
        35,
        68,
      );

      pdf.rect(
        0,
        0,
        pageWidth,
        38,
        "F",
      );


      pdf.setFillColor(
        37,
        99,
        235,
      );

      pdf.roundedRect(
        margin,
        10,
        15,
        15,
        3,
        3,
        "F",
      );


      pdf.setTextColor(
        255,
        255,
        255,
      );

      pdf.setFont(
        "helvetica",
        "bold",
      );

      pdf.setFontSize(
        13,
      );

      pdf.text(
        "S",
        margin + 5.3,
        20,
      );


      pdf.setFontSize(
        16,
      );

      pdf.text(
        "SalesIA Enterprise",
        margin + 21,
        16,
      );


      pdf.setFont(
        "helvetica",
        "normal",
      );

      pdf.setFontSize(
        8,
      );

      pdf.setTextColor(
        180,
        206,
        230,
      );

      pdf.text(
        "Portal del cliente",
        margin + 21,
        21,
      );


      pdf.setFont(
        "helvetica",
        "bold",
      );

      pdf.setFontSize(
        10,
      );

      pdf.setTextColor(
        103,
        232,
        249,
      );

      pdf.text(
        continuation
          ? "COMPROBANTE - CONTINUACIÓN"
          : "COMPROBANTE DE COMPRA",
        pageWidth - margin,
        17,
        {
          align:
            "right",
        },
      );


      pdf.setFont(
        "helvetica",
        "normal",
      );

      pdf.setFontSize(
        7,
      );

      pdf.setTextColor(
        180,
        206,
        230,
      );

      pdf.text(
        "Documento informativo",
        pageWidth - margin,
        22,
        {
          align:
            "right",
        },
      );


      y = 48;
    }


    function ensureSpace(
      neededHeight: number,
    ) {
      if (
        y + neededHeight
        >
        pageHeight - 20
      ) {
        pdf.addPage();

        drawHeader(
          true,
        );
      }
    }


    function labelValue(
      label: string,
      value: string,
      x: number,
      width: number,
    ) {
      pdf.setFont(
        "helvetica",
        "normal",
      );

      pdf.setFontSize(
        7,
      );

      pdf.setTextColor(
        100,
        116,
        139,
      );

      pdf.text(
        label,
        x,
        y,
      );


      pdf.setFont(
        "helvetica",
        "bold",
      );

      pdf.setFontSize(
        9,
      );

      pdf.setTextColor(
        30,
        41,
        59,
      );

      const lines =
        pdf.splitTextToSize(
          value || "-",
          width,
        );

      pdf.text(
        lines,
        x,
        y + 5,
      );
    }


    drawHeader();


    // ========================================================
    // CLIENTE Y OPERACION
    // ========================================================

    pdf.setTextColor(
      8,
      145,
      178,
    );

    pdf.setFont(
      "helvetica",
      "bold",
    );

    pdf.setFontSize(
      8,
    );

    pdf.text(
      "DATOS DE LA COMPRA",
      margin,
      y,
    );

    y += 8;


    const colWidth =
      (
        contentWidth - 8
      )
      / 2;


    labelValue(
      "Cliente",
      customerName,
      margin,
      colWidth,
    );

    labelValue(
      "DNI",
      String(
        customer
          ?.document_number
        ||
        user?.dni
        ||
        "-"
      ),
      margin
      + colWidth
      + 8,
      colWidth,
    );

    y += 15;


    labelValue(
      "Número de compra",
      String(
        sale.sale_number
        ||
        sale.id
        ||
        "-"
      ),
      margin,
      colWidth,
    );

    labelValue(
      "Fecha",
      formatDate(
        sale.sale_date,
      ),
      margin
      + colWidth
      + 8,
      colWidth,
    );

    y += 15;


    labelValue(
      "Estado",
      String(
        sale.status
        ||
        "Registrada"
      ),
      margin,
      colWidth,
    );

    labelValue(
      "Ubicación",
      [
        customer?.address,
        customer?.city,
      ]
        .filter(Boolean)
        .join(", ")
      ||
      "No registrada",
      margin
      + colWidth
      + 8,
      colWidth,
    );

    y += 16;


    pdf.setDrawColor(
      226,
      232,
      240,
    );

    pdf.line(
      margin,
      y,
      pageWidth - margin,
      y,
    );

    y += 9;


    // ========================================================
    // PRODUCTOS
    // ========================================================

    pdf.setTextColor(
      8,
      145,
      178,
    );

    pdf.setFont(
      "helvetica",
      "bold",
    );

    pdf.setFontSize(
      8,
    );

    pdf.text(
      "PRODUCTOS",
      margin,
      y,
    );

    y += 6;


    // Cabecera tabla
    pdf.setFillColor(
      248,
      250,
      252,
    );

    pdf.setDrawColor(
      226,
      232,
      240,
    );

    pdf.rect(
      margin,
      y,
      contentWidth,
      9,
      "FD",
    );


    pdf.setFontSize(
      7,
    );

    pdf.setTextColor(
      71,
      85,
      105,
    );

    pdf.text(
      "Producto",
      margin + 3,
      y + 5.7,
    );

    pdf.text(
      "Cant.",
      margin + 94,
      y + 5.7,
      {
        align:
          "right",
      },
    );

    pdf.text(
      "Precio",
      margin + 121,
      y + 5.7,
      {
        align:
          "right",
      },
    );

    pdf.text(
      "Desc.",
      margin + 145,
      y + 5.7,
      {
        align:
          "right",
      },
    );

    pdf.text(
      "Subtotal",
      pageWidth - margin - 3,
      y + 5.7,
      {
        align:
          "right",
      },
    );

    y += 9;


    const items =
      sale.items
      ?? [];


    if (
      items.length === 0
    ) {
      pdf.setFont(
        "helvetica",
        "normal",
      );

      pdf.setFontSize(
        8,
      );

      pdf.setTextColor(
        148,
        163,
        184,
      );

      pdf.text(
        "No hay detalle de productos disponible para esta compra.",
        margin + 3,
        y + 9,
      );

      y += 18;

    } else {

      for (
        const item
        of items
      ) {
        const productName =
          String(
            item.product_name
            ||
            "Producto"
          );

        const sku =
          String(
            item.sku
            ||
            "Sin SKU"
          );


        const nameLines =
          pdf.splitTextToSize(
            productName,
            76,
          );


        const rowHeight =
          Math.max(
            13,
            8
            +
            nameLines.length
            * 4,
          );


        ensureSpace(
          rowHeight
          + 4,
        );


        pdf.setDrawColor(
          237,
          241,
          245,
        );

        pdf.rect(
          margin,
          y,
          contentWidth,
          rowHeight,
        );


        pdf.setFont(
          "helvetica",
          "bold",
        );

        pdf.setFontSize(
          8,
        );

        pdf.setTextColor(
          51,
          65,
          85,
        );

        pdf.text(
          nameLines,
          margin + 3,
          y + 5,
        );


        pdf.setFont(
          "helvetica",
          "normal",
        );

        pdf.setFontSize(
          6.5,
        );

        pdf.setTextColor(
          148,
          163,
          184,
        );

        pdf.text(
          sku,
          margin + 3,
          y
          + rowHeight
          - 3,
        );


        pdf.setFont(
          "helvetica",
          "normal",
        );

        pdf.setFontSize(
          7.5,
        );

        pdf.setTextColor(
          51,
          65,
          85,
        );


        pdf.text(
          String(
            numericValue(
              item.quantity,
            ),
          ),
          margin + 94,
          y + 7,
          {
            align:
              "right",
          },
        );


        pdf.text(
          formatMoney(
            item.unit_price,
          ),
          margin + 121,
          y + 7,
          {
            align:
              "right",
          },
        );


        pdf.text(
          formatMoney(
            item.discount,
          ),
          margin + 145,
          y + 7,
          {
            align:
              "right",
          },
        );


        pdf.setFont(
          "helvetica",
          "bold",
        );

        pdf.text(
          formatMoney(
            item.subtotal,
          ),
          pageWidth
          - margin
          - 3,
          y + 7,
          {
            align:
              "right",
          },
        );


        y += rowHeight;
      }
    }


    // ========================================================
    // TOTALES
    // ========================================================

    ensureSpace(
      52,
    );

    y += 8;


    const totalsX =
      pageWidth
      - margin
      - 72;


    function totalLine(
      label: string,
      value:
        | number
        | string
        | null
        | undefined,
      bold = false,
    ) {
      pdf.setFont(
        "helvetica",
        bold
          ? "bold"
          : "normal",
      );

      pdf.setFontSize(
        bold
          ? 10
          : 8,
      );

      pdf.setTextColor(
        bold
          ? 29
          : 100,
        bold
          ? 78
          : 116,
        bold
          ? 216
          : 139,
      );

      pdf.text(
        label,
        totalsX,
        y,
      );

      pdf.text(
        formatMoney(
          value,
        ),
        pageWidth - margin,
        y,
        {
          align:
            "right",
        },
      );

      y +=
        bold
          ? 8
          : 6;
    }


    totalLine(
      "Subtotal",
      sale.subtotal,
    );

    totalLine(
      "Descuento",
      sale.discount,
    );

    totalLine(
      "Impuesto",
      sale.tax,
    );


    pdf.setDrawColor(
      219,
      234,
      254,
    );

    pdf.line(
      totalsX,
      y - 2,
      pageWidth - margin,
      y - 2,
    );

    y += 3;


    totalLine(
      "TOTAL",
      sale.total,
      true,
    );


    // ========================================================
    // NOTA
    // ========================================================

    ensureSpace(
      25,
    );

    y += 6;


    pdf.setFillColor(
      248,
      250,
      252,
    );

    pdf.setDrawColor(
      226,
      232,
      240,
    );

    pdf.roundedRect(
      margin,
      y,
      contentWidth,
      17,
      2,
      2,
      "FD",
    );


    pdf.setFont(
      "helvetica",
      "normal",
    );

    pdf.setFontSize(
      7,
    );

    pdf.setTextColor(
      100,
      116,
      139,
    );


    const note =
      pdf.splitTextToSize(
        "Este comprobante es un documento informativo generado desde el Portal del Cliente de SalesIA Enterprise. Los datos corresponden a la operación registrada en el sistema.",
        contentWidth - 8,
      );


    pdf.text(
      note,
      margin + 4,
      y + 6,
    );


    // ========================================================
    // PAGINACION
    // ========================================================

    const totalPages =
      pdf.getNumberOfPages();


    for (
      let page = 1;
      page <= totalPages;
      page += 1
    ) {
      pdf.setPage(
        page,
      );

      pdf.setFont(
        "helvetica",
        "normal",
      );

      pdf.setFontSize(
        6.5,
      );

      pdf.setTextColor(
        148,
        163,
        184,
      );

      pdf.text(
        `SalesIA Enterprise · Página ${page} de ${totalPages}`,
        pageWidth / 2,
        pageHeight - 8,
        {
          align:
            "center",
        },
      );
    }


    return pdf;
  }


  function getPurchaseFileName(
    sale:
      CustomerPortalSale,
  ) {
    const identifier =
      String(
        sale.sale_number
        ||
        sale.id
        ||
        "compra",
      )
        .replace(
          /[^a-zA-Z0-9_-]/g,
          "-",
        );

    return (
      `comprobante-${identifier}.pdf`
    );
  }


  async function downloadPurchasePdf(
    sale:
      CustomerPortalSale,
  ) {
    const pdf =
      await createPurchaseDocument(
        sale,
      );

    pdf.save(
      getPurchaseFileName(
        sale,
      ),
    );

    setSuccess(
      "Comprobante PDF generado correctamente.",
    );
  }


  async function printPurchasePdf(
    sale:
      CustomerPortalSale,
  ) {
    const pdf =
      await createPurchaseDocument(
        sale,
      );

    const url =
      String(
        pdf.output(
          "bloburl",
        ),
      );


    const windowPdf =
      window.open(
        url,
        "_blank",
      );


    if (!windowPdf) {
      setError(
        "El navegador bloqueó la ventana del comprobante. Habilita las ventanas emergentes e inténtalo nuevamente.",
      );

      return;
    }


    setSuccess(
      "Comprobante abierto. Puedes imprimirlo desde el visor PDF del navegador.",
    );


    window.setTimeout(
      () => {
        try {
          URL.revokeObjectURL(
            url,
          );
        } catch {
          // El navegador puede mantener
          // el PDF abierto en otra pestaña.
        }
      },
      60000,
    );
  }


  function handleLogout() {
    logout();

    navigate(
      "/login",
      {
        replace: true,
      },
    );
  }


  function cancelEditing() {
    setForm({
      email:
        customer?.email
        ?? "",

      phone:
        customer?.phone
        ?? "",

      address:
        customer?.address
        ?? "",

      city:
        customer?.city
        ?? "",
    });

    setEditing(
      false,
    );
  }


  async function saveProfile() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await updateCustomerProfile({
        email:
          form.email.trim()
          || null,

        phone:
          form.phone.trim()
          || null,

        address:
          form.address.trim()
          || null,

        city:
          form.city.trim()
          || null,
      });

      await loadPortal(
        true,
      );

      setEditing(
        false,
      );

      setSuccess(
        "Tus datos fueron actualizados correctamente.",
      );
    } catch (
      currentError
    ) {
      setError(
        currentError
          instanceof Error
          ? currentError.message
          : "No se pudieron guardar tus datos.",
      );
    } finally {
      setSaving(false);
    }
  }


  async function handleChangePassword() {
    setError("");
    setSuccess("");


    if (
      passwordForm.newPassword.length
      < 8
    ) {
      setError(
        "La nueva contraseña debe tener al menos 8 caracteres.",
      );

      return;
    }


    if (
      passwordForm.newPassword
      !==
      passwordForm.confirmPassword
    ) {
      setError(
        "Las nuevas contraseñas no coinciden.",
      );

      return;
    }


    if (
      passwordForm.currentPassword
      ===
      passwordForm.newPassword
    ) {
      setError(
        "La nueva contraseña debe ser diferente a la actual.",
      );

      return;
    }


    try {
      setChangingPassword(
        true,
      );


      await changeCustomerPassword({
        current_password:
          passwordForm.currentPassword,

        new_password:
          passwordForm.newPassword,
      });


      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });


      setSuccess(
        "Contraseña actualizada correctamente.",
      );
    } catch (
      currentError
    ) {
      setError(
        currentError
          instanceof Error
          ? currentError.message
          : "No se pudo cambiar la contraseña.",
      );
    } finally {
      setChangingPassword(
        false,
      );
    }
  }


  if (loading) {
    return (
      <div className="client-loading app-loading-screen">
        <div className="client-loading-card app-loading-card">
          <div className="client-loading-logo app-loading-mark">
            S
          </div>

          <strong>
            SalesIA
          </strong>

          <span>
            Cargando portal...
          </span>
        </div>
      </div>
    );
  }


  return (
    <div className="client-shell app-shell reference-shell">

      {sidebarOpen && (
        <button
          type="button"
          className="client-sidebar-overlay sidebar-overlay"
          aria-label="Cerrar menú"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}


      {/* ====================================================
          SIDEBAR CLIENTE
          ==================================================== */}

      <aside
        className={
          `client-sidebar sidebar salesia-sidebar ${
            sidebarOpen
              ? "open sidebar-open"
              : ""
          }`
        }
      >
        <div className="client-sidebar-header sidebar-header">
          <div className="client-brand-icon brand-icon">
            S
          </div>

          <div className="client-brand-text brand-text">
            <strong>
              SalesIA
            </strong>

            <span>
              Portal Cliente
            </span>
          </div>

          <button
            type="button"
            className="client-sidebar-close sidebar-close"
            onClick={() =>
              setSidebarOpen(false)
            }
          >
            <X size={19} />
          </button>
        </div>


        <div className="client-sidebar-account sidebar-company">
          <div className="client-account-icon">
            <UserRound
              size={18}
            />
          </div>

          <div>
            <span>
              Mi cuenta
            </span>

            <strong>
              {customerName}
            </strong>
          </div>
        </div>


        <nav className="client-sidebar-nav sidebar-nav">
          <div className="sidebar-section">
          <span className="client-sidebar-section-title sidebar-section-title">
            CUENTA
          </span>


          <button
            type="button"
            className={
              section === "inicio"
                ? "client-sidebar-item sidebar-item active"
                : "client-sidebar-item sidebar-item"
            }
            onClick={() =>
              changeSection(
                "inicio",
              )
            }
          >
            <span className="client-sidebar-item-left sidebar-item-left">
              <Home size={18} />

              Inicio
            </span>

            <ChevronRight size={15} className="sidebar-chevron" />
          </button>


          <button
            type="button"
            className={
              section === "compras"
                ? "client-sidebar-item sidebar-item active"
                : "client-sidebar-item sidebar-item"
            }
            onClick={() =>
              changeSection(
                "compras",
              )
            }
          >
            <span className="client-sidebar-item-left sidebar-item-left">
              <ShoppingBag
                size={18}
              />

              Mis compras
            </span>

            <ChevronRight size={15} className="sidebar-chevron" />
          </button>


          <button
            type="button"
            className={
              section === "perfil"
                ? "client-sidebar-item sidebar-item active"
                : "client-sidebar-item sidebar-item"
            }
            onClick={() =>
              changeSection(
                "perfil",
              )
            }
          >
            <span className="client-sidebar-item-left sidebar-item-left">
              <UserRound
                size={18}
              />

              Mi perfil
            </span>

            <ChevronRight size={15} className="sidebar-chevron" />
          </button>
          <button
            type="button"
            className={
              section === "seguridad"
                ? "client-sidebar-item sidebar-item active"
                : "client-sidebar-item sidebar-item"
            }
            onClick={() =>
              changeSection(
                "seguridad",
              )
            }
          >
            <span className="client-sidebar-item-left sidebar-item-left">
              <LockKeyhole
                size={18}
              />

              Seguridad
            </span>

            <ChevronRight size={15} className="sidebar-chevron" />
          </button>
                  </div>
        </nav>



        <button
          type="button"
          className="sidebar-logout"
          onClick={handleLogout}
        >
          <LogOut size={16} />

          <span>
            Cerrar sesión
          </span>
        </button>


        <div className="client-sidebar-bottom">
          <div className="client-sidebar-profile sidebar-profile">
            <div className="client-profile-avatar-small profile-avatar">
              {initials}
            </div>

            <div className="client-profile-data-small profile-data">
              <strong>
                {customerName}
              </strong>

              <span>
                Cliente
              </span>
            </div>
          </div>
        </div>
      </aside>


      {/* ====================================================
          CONTENIDO
          ==================================================== */}

      <div className="client-app-content app-content">

        {/* ==================================================
            TOPBAR
            ================================================== */}

        <header className="client-topbar topbar">
          <div className="client-topbar-left topbar-left">
            <button
              type="button"
              className="client-mobile-menu mobile-menu-button"
              onClick={() =>
                setSidebarOpen(true)
              }
            >
              <Menu size={21} />
            </button>

            <div className="client-topbar-context">
              <span>
                PORTAL DEL CLIENTE
              </span>

              <strong>
                {sectionName}
              </strong>
            </div>
          </div>


          <div className="client-topbar-actions topbar-actions">
            <button
              type="button"
              className="client-icon-button icon-button modern-topbar-icon"
              title="Actualizar información"
              disabled={refreshing}
              onClick={() =>
                void loadPortal(
                  true,
                )
              }
            >
              <RefreshCw
                size={18}
                className={
                  refreshing
                    ? "client-spin"
                    : ""
                }
              />
            </button>


            <div className="client-topbar-divider topbar-divider" />


            <div className="client-user-menu user-menu modern-user-menu">
              <div className="client-user-avatar user-avatar">
                {initials}
              </div>

              <div className="client-user-info user-info">
                <strong>
                  {customerName}
                </strong>

                <span>
                  Cliente
                </span>
              </div>
            </div>


            <button
              type="button"
              className="client-icon-button icon-button modern-topbar-icon client-logout modern-logout-button"
              title="Cerrar sesión"
              onClick={
                handleLogout
              }
            >
              <LogOut
                size={18}
              />
            </button>
          </div>
        </header>


        <main className="client-main-content main-content">

          {error && (
            <div className="client-message error">
              {error}
            </div>
          )}


          {success && (
            <div className="client-message success">
              <CheckCircle2
                size={17}
              />

              {success}
            </div>
          )}


          {/* =================================================
              INICIO
              ================================================= */}

          {section === "inicio" && (
            <section className="client-page module-page">

              <div className="client-page-heading page-heading">
                <div>
                  <span className="client-page-eyebrow page-eyebrow">
                    MI CUENTA
                  </span>

                  <h1>
                    Bienvenido, {customerName}
                  </h1>

                  <p>
                    Consulta tus compras,
                    administra tus datos y revisa
                    la información asociada a tu
                    cuenta SalesIA.
                  </p>
                </div>
              </div>


              <div className="client-highlight dashboard-highlight">
                <div>
                  <span>
                    RESUMEN DE CUENTA
                  </span>

                  <h2>
                    Toda la información de tu
                    cuenta en un solo lugar.
                  </h2>

                  <p>
                    Tus compras y datos personales
                    se actualizan directamente desde
                    SalesIA Enterprise.
                  </p>
                </div>


                <div className="client-highlight-metric highlight-metric">
                  <CheckCircle2
                    size={21}
                  />

                  <div>
                    <strong>
                      {
                        customer?.status
                        === "inactive"
                          ? "Inactiva"
                          : "Activa"
                      }
                    </strong>

                    <span>
                      estado de cuenta
                    </span>
                  </div>
                </div>
              </div>


              <div className="client-stats-grid stats-grid">

                <button
                  type="button"
                  className="client-stat-card stat-card"
                  onClick={() =>
                    changeSection(
                      "compras",
                    )
                  }
                >
                  <div className="client-stat-top stat-card-top">
                    <div className="client-stat-icon stat-icon">
                      <ShoppingBag
                        size={19}
                      />
                    </div>
                  </div>

                  <div className="client-stat-content stat-card-content">
                    <span>
                      Compras registradas
                    </span>

                    <strong>
                      {sales.length}
                    </strong>

                    <small>
                      Ver historial
                    </small>
                  </div>
                </button>


                <button
                  type="button"
                  className="client-stat-card stat-card"
                  onClick={() =>
                    changeSection(
                      "compras",
                    )
                  }
                >
                  <div className="client-stat-top stat-card-top">
                    <div className="client-stat-icon stat-icon">
                      <ReceiptText
                        size={19}
                      />
                    </div>
                  </div>

                  <div className="client-stat-content stat-card-content">
                    <span>
                      Total comprado
                    </span>

                    <strong>
                      {
                        formatMoney(
                          totalPurchased,
                        )
                      }
                    </strong>

                    <small>
                      Acumulado registrado
                    </small>
                  </div>
                </button>


                <button
                  type="button"
                  className="client-stat-card stat-card"
                  onClick={() =>
                    changeSection(
                      "perfil",
                    )
                  }
                >
                  <div className="client-stat-top stat-card-top">
                    <div className="client-stat-icon stat-icon">
                      <UserRound
                        size={19}
                      />
                    </div>
                  </div>

                  <div className="client-stat-content stat-card-content">
                    <span>
                      DNI
                    </span>

                    <strong>
                      {
                        customer
                          ?.document_number
                        ||
                        user?.dni
                        ||
                        "-"
                      }
                    </strong>

                    <small>
                      Datos de mi cuenta
                    </small>
                  </div>
                </button>


                <button
                  type="button"
                  className="client-stat-card stat-card"
                  onClick={() =>
                    changeSection(
                      "compras",
                    )
                  }
                >
                  <div className="client-stat-top stat-card-top">
                    <div className="client-stat-icon stat-icon">
                      <CalendarDays
                        size={19}
                      />
                    </div>
                  </div>

                  <div className="client-stat-content stat-card-content">
                    <span>
                      Última compra
                    </span>

                    <strong className="client-stat-date">
                      {
                        lastSale
                          ? formatDate(
                              lastSale
                                .sale_date,
                            )
                          : "Sin compras"
                      }
                    </strong>

                    <small>
                      Última operación registrada
                    </small>
                  </div>
                </button>
              </div>


              <div className="client-dashboard-grid dashboard-main-grid">

                <article className="client-panel panel">
                  <div className="client-panel-header panel-header">
                    <div>
                      <span className="client-panel-label panel-label">
                        ACTIVIDAD
                      </span>

                      <h3>
                        Compras recientes
                      </h3>
                    </div>

                    <button
                      type="button"
                      className="client-panel-link"
                      onClick={() =>
                        changeSection(
                          "compras",
                        )
                      }
                    >
                      Ver todas
                    </button>
                  </div>


                  {recentSales.length === 0 ? (
                    <div className="client-empty-state module-state">
                      <ShoppingBag
                        size={29}
                      />

                      <strong>
                        Sin compras registradas
                      </strong>

                      <p>
                        Cuando exista una venta
                        asociada a tu cuenta,
                        aparecerá aquí.
                      </p>
                    </div>
                  ) : (
                    <div className="client-purchase-list">
                      {recentSales.map(
                        (
                          sale,
                          index,
                        ) => (
                          <button
                            type="button"
                            className="client-purchase-item"
                            key={
                              sale.id
                              ??
                              index
                            }
                            onClick={() =>
                              setSelectedSale(
                                sale,
                              )
                            }
                          >
                            <div className="client-purchase-icon">
                              <ReceiptText
                                size={18}
                              />
                            </div>

                            <div className="client-purchase-info">
                              <strong>
                                {
                                  sale.sale_number
                                  ||
                                  `Compra ${index + 1}`
                                }
                              </strong>

                              <span>
                                {
                                  formatDate(
                                    sale.sale_date,
                                  )
                                }
                              </span>
                            </div>

                            <span className="client-status-badge status-badge success">
                              {
                                sale.status
                                ||
                                "Registrada"
                              }
                            </span>

                            <strong className="client-purchase-total">
                              {
                                formatMoney(
                                  sale.total,
                                )
                              }
                            </strong>

                            <ChevronRight
                              size={16}
                            />
                          </button>
                        ),
                      )}
                    </div>
                  )}
                </article>


                <article className="client-panel panel client-profile-panel">
                  <div className="client-panel-header panel-header">
                    <div>
                      <span className="client-panel-label panel-label">
                        PERFIL
                      </span>

                      <h3>
                        Mis datos
                      </h3>
                    </div>

                    <UserRound
                      size={18}
                    />
                  </div>


                  <div className="client-info-row">
                    <Mail
                      size={17}
                    />

                    <div>
                      <span>
                        Correo
                      </span>

                      <strong>
                        {
                          customer?.email
                          ||
                          "No registrado"
                        }
                      </strong>
                    </div>
                  </div>


                  <div className="client-info-row">
                    <Phone
                      size={17}
                    />

                    <div>
                      <span>
                        Teléfono
                      </span>

                      <strong>
                        {
                          customer?.phone
                          ||
                          "No registrado"
                        }
                      </strong>
                    </div>
                  </div>


                  <div className="client-info-row">
                    <MapPin
                      size={17}
                    />

                    <div>
                      <span>
                        Ubicación
                      </span>

                      <strong>
                        {
                          [
                            customer?.address,
                            customer?.city,
                          ]
                            .filter(Boolean)
                            .join(", ")
                          ||
                          "No registrada"
                        }
                      </strong>
                    </div>
                  </div>


                  <button
                    type="button"
                    className="client-panel-action secondary-button"
                    onClick={() =>
                      changeSection(
                        "perfil",
                      )
                    }
                  >
                    Administrar mis datos
                  </button>
                </article>
              </div>
            </section>
          )}


          {/* =================================================
              COMPRAS
              ================================================= */}

          {section === "compras" && (
            <section className="client-page module-page">

              <div className="client-page-heading page-heading">
                <div>
                  <span className="client-page-eyebrow page-eyebrow">
                    OPERACIONES
                  </span>

                  <h1>
                    Mis compras
                  </h1>

                  <p>
                    Consulta el historial de
                    operaciones registradas a
                    tu nombre.
                  </p>
                </div>


                <button
                  type="button"
                  className="client-secondary-button secondary-button"
                  disabled={refreshing}
                  onClick={() =>
                    void loadPortal(
                      true,
                    )
                  }
                >
                  <RefreshCw
                    size={16}
                    className={
                      refreshing
                        ? "client-spin"
                        : ""
                    }
                  />

                  Actualizar
                </button>
              </div>


              <div className="client-table-toolbar table-toolbar">
                <div className="client-table-search table-search">
                  <Search
                    size={17}
                  />

                  <input
                    value={search}
                    onChange={(
                      event,
                    ) =>
                      setSearch(
                        event.target.value,
                      )
                    }
                    placeholder="Buscar compra, fecha o estado..."
                  />
                </div>

                <span>
                  {
                    filteredSales.length
                  } registros
                </span>
              </div>


              <article className="client-panel panel">
                {filteredSales.length === 0 ? (
                  <div className="client-empty-state module-state large">
                    <ShoppingBag
                      size={34}
                    />

                    <strong>
                      {
                        sales.length === 0
                          ? "Aún no tienes compras"
                          : "Sin resultados"
                      }
                    </strong>

                    <p>
                      {
                        sales.length === 0
                          ? "Las compras asociadas a tu cuenta aparecerán automáticamente aquí."
                          : "Prueba con otro término de búsqueda."
                      }
                    </p>
                  </div>
                ) : (
                  <div className="client-purchase-list">
                    {filteredSales.map(
                      (
                        sale,
                        index,
                      ) => (
                        <button
                          type="button"
                          className="client-purchase-item"
                          key={
                            sale.id
                            ??
                            index
                          }
                          onClick={() =>
                            setSelectedSale(
                              sale,
                            )
                          }
                        >
                          <div className="client-purchase-icon">
                            <ReceiptText
                              size={18}
                            />
                          </div>

                          <div className="client-purchase-info">
                            <strong>
                              {
                                sale.sale_number
                                ||
                                `Compra ${index + 1}`
                              }
                            </strong>

                            <span>
                              <CalendarDays
                                size={13}
                              />

                              {
                                formatDate(
                                  sale.sale_date,
                                )
                              }
                            </span>
                          </div>

                          <span className="client-status-badge status-badge success">
                            {
                              sale.status
                              ||
                              "Registrada"
                            }
                          </span>

                          <strong className="client-purchase-total">
                            {
                              formatMoney(
                                sale.total,
                              )
                            }
                          </strong>

                          <ChevronRight
                            size={17}
                          />
                        </button>
                      ),
                    )}
                  </div>
                )}
              </article>
            </section>
          )}


          {/* =================================================
              PERFIL
              ================================================= */}

          {section === "perfil" && (
            <section className="client-page module-page">

              <div className="client-page-heading page-heading">
                <div>
                  <span className="client-page-eyebrow page-eyebrow">
                    CUENTA
                  </span>

                  <h1>
                    Mi perfil
                  </h1>

                  <p>
                    Consulta y actualiza tu
                    información de contacto.
                  </p>
                </div>
              </div>


              <div className="client-profile-grid dashboard-main-grid">

                <article className="client-panel panel">
                  <div className="client-profile-heading">
                    <div className="client-profile-avatar-large">
                      {initials}
                    </div>

                    <div>
                      <h3>
                        {customerName}
                      </h3>

                      <span>
                        DNI {
                          customer
                            ?.document_number
                          ||
                          user?.dni
                          ||
                          "-"
                        }
                      </span>
                    </div>


                    {!editing && (
                      <button
                        type="button"
                        className="client-secondary-button secondary-button client-edit-button"
                        onClick={() => {
                          setSuccess("");
                          setEditing(true);
                        }}
                      >
                        <Pencil
                          size={15}
                        />

                        Editar
                      </button>
                    )}
                  </div>


                  {!editing ? (
                    <div className="client-profile-data">
                      <div>
                        <span>
                          Correo electrónico
                        </span>

                        <strong>
                          {
                            customer?.email
                            ||
                            "No registrado"
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Teléfono
                        </span>

                        <strong>
                          {
                            customer?.phone
                            ||
                            "No registrado"
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Dirección
                        </span>

                        <strong>
                          {
                            customer?.address
                            ||
                            "No registrada"
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Ciudad / distrito
                        </span>

                        <strong>
                          {
                            customer?.city
                            ||
                            "No registrado"
                          }
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div className="client-profile-form enterprise-form form-grid">

                      <label>
                        <span>
                          Correo electrónico
                        </span>

                        <input
                          type="email"
                          value={
                            form.email
                          }
                          onChange={(
                            event,
                          ) =>
                            setForm({
                              ...form,
                              email:
                                event.target.value,
                            })
                          }
                        />
                      </label>


                      <label>
                        <span>
                          Teléfono
                        </span>

                        <input
                          value={
                            form.phone
                          }
                          onChange={(
                            event,
                          ) =>
                            setForm({
                              ...form,
                              phone:
                                event.target.value,
                            })
                          }
                        />
                      </label>


                      <label className="full form-full">
                        <span>
                          Dirección
                        </span>

                        <input
                          value={
                            form.address
                          }
                          onChange={(
                            event,
                          ) =>
                            setForm({
                              ...form,
                              address:
                                event.target.value,
                            })
                          }
                        />
                      </label>


                      <label className="full form-full">
                        <span>
                          Ciudad / distrito
                        </span>

                        <input
                          value={
                            form.city
                          }
                          onChange={(
                            event,
                          ) =>
                            setForm({
                              ...form,
                              city:
                                event.target.value,
                            })
                          }
                        />
                      </label>


                      <div className="client-form-actions modal-actions">
                        <button
                          type="button"
                          className="client-secondary-button secondary-button"
                          disabled={saving}
                          onClick={
                            cancelEditing
                          }
                        >
                          <X size={15} />

                          Cancelar
                        </button>

                        <button
                          type="button"
                          className="client-primary-button primary-button"
                          disabled={saving}
                          onClick={() =>
                            void saveProfile()
                          }
                        >
                          <Save
                            size={15}
                          />

                          {
                            saving
                              ? "Guardando..."
                              : "Guardar cambios"
                          }
                        </button>
                      </div>
                    </div>
                  )}
                </article>


                <article className="client-panel panel client-account-panel">
                  <div className="client-panel-header panel-header">
                    <div>
                      <span className="client-panel-label panel-label">
                        INFORMACIÓN
                      </span>

                      <h3>
                        Estado de cuenta
                      </h3>
                    </div>
                  </div>


                  <div className="client-account-status">
                    <CheckCircle2
                      size={20}
                    />

                    <div>
                      <span>
                        Estado
                      </span>

                      <strong>
                        {
                          customer?.status
                          === "inactive"
                            ? "Cuenta inactiva"
                            : "Cuenta activa"
                        }
                      </strong>
                    </div>
                  </div>


                  <p className="client-account-description">
                    Tu cuenta está vinculada
                    directamente con tu registro
                    de cliente en SalesIA.
                  </p>
                </article>
              </div>
            </section>
          )}



          {/* =================================================
              SEGURIDAD
              ================================================= */}

          {section === "seguridad" && (
            <section className="client-page module-page">

              <div className="client-page-heading page-heading">
                <div>
                  <span className="client-page-eyebrow page-eyebrow">
                    SEGURIDAD
                  </span>

                  <h1>
                    Seguridad de mi cuenta
                  </h1>

                  <p>
                    Cambia la contraseña utilizada
                    para acceder a tu portal SalesIA.
                  </p>
                </div>
              </div>


              <div className="client-security-grid dashboard-main-grid">

                <article className="client-panel panel">
                  <div className="client-security-heading">
                    <div className="client-security-icon">
                      <LockKeyhole
                        size={21}
                      />
                    </div>

                    <div>
                      <h3>
                        Cambiar contraseña
                      </h3>

                      <p>
                        Primero confirma tu contraseña
                        actual y luego registra una nueva.
                      </p>
                    </div>
                  </div>


                  <div className="client-security-form enterprise-form">

                    <label>
                      <span>
                        Contraseña actual
                      </span>

                      <input
                        type="password"
                        value={
                          passwordForm
                            .currentPassword
                        }
                        onChange={(
                          event,
                        ) =>
                          setPasswordForm({
                            ...passwordForm,

                            currentPassword:
                              event.target.value,
                          })
                        }
                        autoComplete="current-password"
                      />
                    </label>


                    <label>
                      <span>
                        Nueva contraseña
                      </span>

                      <input
                        type="password"
                        value={
                          passwordForm
                            .newPassword
                        }
                        onChange={(
                          event,
                        ) =>
                          setPasswordForm({
                            ...passwordForm,

                            newPassword:
                              event.target.value,
                          })
                        }
                        autoComplete="new-password"
                      />

                      <small>
                        Mínimo 8 caracteres.
                      </small>
                    </label>


                    <label>
                      <span>
                        Repetir nueva contraseña
                      </span>

                      <input
                        type="password"
                        value={
                          passwordForm
                            .confirmPassword
                        }
                        onChange={(
                          event,
                        ) =>
                          setPasswordForm({
                            ...passwordForm,

                            confirmPassword:
                              event.target.value,
                          })
                        }
                        autoComplete="new-password"
                      />
                    </label>


                    <div className="client-security-actions">
                      <button
                        type="button"
                        className="client-primary-button primary-button"
                        disabled={
                          changingPassword
                          ||
                          !passwordForm.currentPassword
                          ||
                          !passwordForm.newPassword
                          ||
                          !passwordForm.confirmPassword
                        }
                        onClick={() =>
                          void handleChangePassword()
                        }
                      >
                        <Save
                          size={15}
                        />

                        {
                          changingPassword
                            ? "Actualizando..."
                            : "Cambiar contraseña"
                        }
                      </button>
                    </div>
                  </div>
                </article>


                <article className="client-panel panel client-account-panel">
                  <div className="client-panel-header panel-header">
                    <div>
                      <span className="client-panel-label panel-label">
                        PROTECCIÓN
                      </span>

                      <h3>
                        Acceso a tu cuenta
                      </h3>
                    </div>

                    <LockKeyhole
                      size={18}
                    />
                  </div>


                  <div className="client-security-note">
                    <CheckCircle2
                      size={19}
                    />

                    <div>
                      <strong>
                        Cuenta protegida
                      </strong>

                      <span>
                        Tu contraseña se gestiona
                        mediante el sistema de
                        autenticación de SalesIA.
                      </span>
                    </div>
                  </div>


                  <p className="client-account-description">
                    Nunca compartas tu contraseña
                    con otras personas.
                  </p>
                </article>
              </div>
            </section>
          )}

        </main>
      </div>


      {/* ====================================================
          MODAL COMPRA
          ==================================================== */}

      {selectedSale && (
        <div
          className="client-modal-overlay modal-backdrop"
          onClick={() =>
            setSelectedSale(null)
          }
        >
          <article
            className="client-modal modal-card"
            onClick={(
              event,
            ) =>
              event.stopPropagation()
            }
          >
            <header className="client-modal-header modal-header">
              <div>
                <span>
                  DETALLE DE COMPRA
                </span>

                <h2>
                  {
                    selectedSale.sale_number
                    ||
                    "Compra"
                  }
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedSale(null)
                }
              >
                <X size={18} />
              </button>
            </header>


            <div className="client-modal-content modal-content">
              <div className="client-detail-grid">
                <div>
                  <span>
                    Fecha
                  </span>

                  <strong>
                    {
                      formatDate(
                        selectedSale.sale_date,
                      )
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Estado
                  </span>

                  <strong>
                    {
                      selectedSale.status
                      ||
                      "Registrada"
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Subtotal
                  </span>

                  <strong>
                    {
                      formatMoney(
                        selectedSale.subtotal,
                      )
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Descuento
                  </span>

                  <strong>
                    {
                      formatMoney(
                        selectedSale.discount,
                      )
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Impuesto
                  </span>

                  <strong>
                    {
                      formatMoney(
                        selectedSale.tax,
                      )
                    }
                  </strong>
                </div>

                <div className="client-detail-total">
                  <span>
                    Total
                  </span>

                  <strong>
                    {
                      formatMoney(
                        selectedSale.total,
                      )
                    }
                  </strong>
                </div>
              </div>


              <div className="client-purchased-products">
                <div className="client-products-heading">
                  <span>
                    PRODUCTOS
                  </span>

                  <strong>
                    {
                      selectedSale.items?.length
                      ?? 0
                    } productos
                  </strong>
                </div>


                {
                  !selectedSale.items
                  ||
                  selectedSale.items.length === 0
                    ? (
                      <div className="client-products-empty">
                        No hay detalle de productos disponible
                        para esta compra.
                      </div>
                    )
                    : (
                      <div className="client-products-list">
                        {
                          selectedSale.items.map(
                            (
                              item,
                              index,
                            ) => (
                              <div
                                className="client-product-line"
                                key={
                                  item.product_id
                                  ??
                                  `${item.sku ?? "producto"}-${index}`
                                }
                              >
                                <div className="client-product-symbol">
                                  <ShoppingBag
                                    size={17}
                                  />
                                </div>


                                <div className="client-product-description">
                                  <strong>
                                    {
                                      item.product_name
                                      ||
                                      "Producto"
                                    }
                                  </strong>

                                  <span>
                                    {
                                      item.sku
                                      ||
                                      "Sin SKU"
                                    }
                                  </span>
                                </div>


                                <div className="client-product-quantity">
                                  <span>
                                    Cant.
                                  </span>

                                  <strong>
                                    {
                                      Number(
                                        item.quantity
                                        ?? 0,
                                      )
                                    }
                                  </strong>
                                </div>


                                <div className="client-product-price">
                                  <span>
                                    Precio
                                  </span>

                                  <strong>
                                    {
                                      formatMoney(
                                        item.unit_price,
                                      )
                                    }
                                  </strong>
                                </div>


                                <div className="client-product-subtotal">
                                  <span>
                                    Subtotal
                                  </span>

                                  <strong>
                                    {
                                      formatMoney(
                                        item.subtotal,
                                      )
                                    }
                                  </strong>
                                </div>
                              </div>
                            ),
                          )
                        }
                      </div>
                    )
                }
              </div>
              <div className="client-receipt-actions modal-actions">
                <button
                  type="button"
                  className="client-secondary-button secondary-button"
                  onClick={() =>
                    void printPurchasePdf(
                      selectedSale,
                    )
                  }
                >
                  <Printer
                    size={15}
                  />

                  Ver / imprimir
                </button>


                <button
                  type="button"
                  className="client-primary-button primary-button"
                  onClick={() =>
                    void downloadPurchasePdf(
                      selectedSale,
                    )
                  }
                >
                  <Download
                    size={15}
                  />

                  Descargar PDF
                </button>
              </div>


            </div>
          </article>
        </div>
      )}
    </div>
  );
}
