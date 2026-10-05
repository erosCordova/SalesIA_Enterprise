import {
  clearStoredSession,
  getStoredAccessToken,
  isStoredSessionExpired,
} from "./session";

export const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api/v1";

function expireCurrentSession() {
  clearStoredSession();
  window.dispatchEvent(new Event("salesia:session-expired"));
}

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

const VALIDATION_FIELD_LABELS: Record<string, string> = {
  body: "Solicitud",
  dni: "DNI",
  first_name: "Nombres",
  last_name: "Apellidos",
  password: "Contraseña",
  role: "Rol",
  phone: "Teléfono",
  document_type: "Tipo de documento",
  document_number: "Número de documento",
  business_name: "Razón social",
  email: "Correo electrónico",
  name: "Nombre",
  sku: "Código SKU",
  sale_price: "Precio de venta",
  cost_price: "Precio de costo",
  initial_stock: "Stock inicial",
  minimum_stock: "Stock mínimo",
  maximum_stock: "Stock máximo",
  items: "Productos de la venta",
  quantity: "Cantidad",
  discount: "Descuento",
  tax_rate: "Impuesto",
  start_date: "Fecha inicial",
  end_date: "Fecha final",
  report_type: "Tipo de reporte",
  employee_id: "Vendedor",
  category_id: "Categoría",
  values: "Valores",
  probabilities: "Probabilidades",
  event_a: "Evento A",
  event_b: "Evento B",
  probability_a: "P(A)",
  probability_b_given_a: "P(B|A)",
  probability_b: "P(B)",
};

function formatValidationErrors(details: unknown): string | null {
  if (!Array.isArray(details)) return null;

  const messages = details.slice(0, 3).map((issue) => {
    if (!issue || typeof issue !== "object") return null;

    const error = issue as {
      loc?: unknown[];
      type?: string;
      msg?: string;
      ctx?: Record<string, unknown>;
    };
    const path = (error.loc ?? [])
      .slice(1)
      .map((part) => {
        if (typeof part === "number") return `elemento ${part + 1}`;
        if (typeof part !== "string") return "";
        return VALIDATION_FIELD_LABELS[part] ?? part.replaceAll("_", " ");
      })
      .filter(Boolean);
    const field = path.join(" · ");
    const context = error.ctx ?? {};
    let reason: string;

    switch (error.type) {
      case "missing":
        reason = "es obligatorio.";
        break;
      case "string_too_short":
        reason = `debe tener al menos ${context.min_length ?? "el mínimo"} caracteres.`;
        break;
      case "string_too_long":
        reason = `no puede superar ${context.max_length ?? "el máximo"} caracteres.`;
        break;
      case "string_pattern_mismatch":
        reason = "no tiene el formato esperado.";
        break;
      case "greater_than_equal":
        reason = `debe ser como mínimo ${context.ge}.`;
        break;
      case "greater_than":
        reason = `debe ser mayor que ${context.gt}.`;
        break;
      case "less_than_equal":
        reason = `no puede superar ${context.le}.`;
        break;
      case "less_than":
        reason = `debe ser menor que ${context.lt}.`;
        break;
      case "finite_number":
        reason = "debe ser un número finito.";
        break;
      case "date_parsing":
      case "date_from_datetime_parsing":
        reason = "usa una fecha válida.";
        break;
      case "uuid_parsing":
        reason = "selecciona un elemento válido.";
        break;
      case "enum":
        reason = "elige una opción válida.";
        break;
      case "too_long":
        reason = `supera el máximo permitido de ${context.max_length ?? "elementos"}.`;
        break;
      case "value_error":
        reason = (error.msg ?? "Revisa los datos ingresados.")
          .replace(/^Value error,\s*/i, "");
        break;
      default:
        reason = "revisa el formato ingresado.";
    }

    return field ? `${field}: ${reason}` : reason;
  }).filter((message): message is string => Boolean(message));

  return messages.length
    ? `Revisa los datos ingresados. ${messages.join(" ")}`
    : null;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const expired = isStoredSessionExpired();
  if (expired) expireCurrentSession();
  const token = expired ? null : getStoredAccessToken();

  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  headers.set("Accept", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      "No se pudo conectar con el servidor. Verifica que FastAPI esté ejecutándose.",
      0,
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      expireCurrentSession();
    }

    const validationMessage = response.status === 422
      ? formatValidationErrors(data?.detail)
      : null;
    const detail =
      typeof data?.detail === "string"
        ? data.detail
        : validationMessage ?? "Ocurrió un error al comunicarse con el servidor.";

    throw new ApiError(detail, response.status, data);
  }

  return data as T;
}
