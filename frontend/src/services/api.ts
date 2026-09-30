const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api/v1";


export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem(
    "access_token",
  );

  const headers = new Headers(
    options.headers,
  );

  headers.set(
    "Content-Type",
    "application/json",
  );

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`,
    );
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    },
  );

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem(
        "access_token",
      );

      localStorage.removeItem(
        "user",
      );
    }

    throw new Error(
      data?.detail ||
        "Ocurrió un error al comunicarse con el servidor.",
    );
  }

  return data as T;
}
