const API_URL =
  import.meta.env.VITE_API_URL ||
  (
    import.meta.env.PROD
      ? "https://salesia-enterprise.onrender.com/api/v1"
      : "http://localhost:8000/api/v1"
  );

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    localStorage.getItem(
      "access_token",
    );

  const headers =
    new Headers(
      options.headers,
    );

  if (
    options.body &&
    !headers.has(
      "Content-Type",
    )
  ) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  headers.set(
    "Accept",
    "application/json",
  );

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`,
    );
  }

  let response: Response;

  try {
    response =
      await fetch(
        `${API_URL}${endpoint}`,
        {
          ...options,
          headers,
        },
      );
  } catch {
    throw new ApiError(
      "No se pudo conectar con el servidor. Inténtalo nuevamente en unos segundos.",
      0,
    );
  }

  const data =
    await response
      .json()
      .catch(
        () => null,
      );

  if (!response.ok) {
    if (
      response.status === 401
    ) {
      localStorage.removeItem(
        "access_token",
      );

      localStorage.removeItem(
        "user",
      );
    }

    const detail =
      typeof data?.detail ===
        "string"
        ? data.detail
        : "Ocurrió un error al comunicarse con el servidor.";

    throw new ApiError(
      detail,
      response.status,
      data,
    );
  }

  return data as T;
}
