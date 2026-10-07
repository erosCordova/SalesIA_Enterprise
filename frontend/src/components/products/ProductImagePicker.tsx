import {
  useEffect,
  useMemo,
  type ChangeEvent,
} from "react";

import {
  ImagePlus,
  PackageSearch,
  X,
} from "lucide-react";

import "./ProductImagePicker.css";


const MAX_IMAGE_BYTES =
  5 * 1024 * 1024;

const ALLOWED_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);


interface ProductImagePickerProps {
  file: File | null;
  existingUrl?: string | null;
  disabled?: boolean;

  onChange: (
    file: File | null,
  ) => void;

  onError: (
    message: string,
  ) => void;
}


export default function ProductImagePicker({
  file,
  existingUrl = null,
  disabled = false,
  onChange,
  onError,
}: ProductImagePickerProps) {
  const previewUrl =
    useMemo(
      () => {
        if (!file) {
          return null;
        }

        return URL.createObjectURL(
          file,
        );
      },
      [
        file,
      ],
    );


  useEffect(
    () => {
      return () => {
        if (previewUrl) {
          URL.revokeObjectURL(
            previewUrl,
          );
        }
      };
    },
    [
      previewUrl,
    ],
  );


  const visibleImage =
    previewUrl
    || existingUrl
    || null;


  function handleFile(
    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    const selected =
      event.target.files?.[0];

    event.target.value = "";

    if (!selected) {
      return;
    }

    if (
      !ALLOWED_TYPES.has(
        selected.type,
      )
    ) {
      onError(
        "La imagen debe ser JPG, PNG o WEBP.",
      );

      return;
    }

    if (
      selected.size >
      MAX_IMAGE_BYTES
    ) {
      onError(
        "La imagen no puede superar 5 MB.",
      );

      return;
    }

    onError("");
    onChange(selected);
  }


  return (
    <section className="product-image-picker">
      <div className="product-image-preview">
        {visibleImage ? (
          <img
            src={visibleImage}
            alt="Vista previa del producto"
          />
        ) : (
          <div className="product-image-placeholder">
            <PackageSearch
              size={31}
            />

            <span>
              Sin imagen
            </span>
          </div>
        )}
      </div>

      <div className="product-image-picker-content">
        <strong>
          Imagen del producto
        </strong>

        <p>
          Selecciona una fotografía
          JPG, PNG o WEBP de hasta 5 MB.
        </p>

        <div className="product-image-actions">
          <label
            className={`product-image-select ${
              disabled
                ? "disabled"
                : ""
            }`}
          >
            <ImagePlus
              size={15}
            />

            {file
              ? "Cambiar selección"
              : existingUrl
                ? "Cambiar imagen"
                : "Seleccionar imagen"}

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={disabled}
              onChange={
                handleFile
              }
            />
          </label>

          {file && (
            <button
              type="button"
              className="product-image-remove"
              disabled={disabled}
              onClick={() => {
                onChange(null);
                onError("");
              }}
            >
              <X size={14} />

              Quitar selección
            </button>
          )}
        </div>

        {file && (
          <small>
            Archivo seleccionado:{" "}
            {file.name}
          </small>
        )}

        {!file && existingUrl && (
          <small>
            Se conservará la imagen
            actual si no eliges otra.
          </small>
        )}
      </div>
    </section>
  );
}
