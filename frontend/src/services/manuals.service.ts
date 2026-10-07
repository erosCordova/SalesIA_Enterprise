import {
  apiFetch,
} from "./api";

import type {
  ManualDocument,
  ManualType,
} from "../types/manuals";


const API_URL =
  import.meta.env.VITE_API_URL
  || (
    import.meta.env.PROD
      ? "https://salesia-enterprise-api.onrender.com/api/v1"
      : "http://127.0.0.1:8000/api/v1"
  );


export function getPublicManuals() {
  return apiFetch<
    ManualDocument[]
  >(
    "/manuals/public",
  );
}


export function manualFileUrl(
  type: ManualType,
) {
  return (
    `${API_URL}`
    + `/manuals/public/${type}/file`
  );
}


export function saveManual(
  type: ManualType,
  title: string,
  file?: File | null,
) {
  const data =
    new FormData();

  data.append(
    "title",
    title,
  );

  if (file) {
    data.append(
      "file",
      file,
    );
  }

  return apiFetch<
    ManualDocument
  >(
    `/manuals/${type}`,

    {
      method:
        "PUT",

      body:
        data,
    },
  );
}


export function deleteManual(
  type: ManualType,
) {
  return apiFetch<{
    message: string;
  }>(
    `/manuals/${type}`,

    {
      method:
        "DELETE",
    },
  );
}
