import {
  BookOpenText,
  FilePenLine,
  FilePlus2,
  FileText,
  Save,
  Trash2,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import ConfirmDialog from "../../components/ui/ConfirmDialog";
import ModuleState from "../../components/ui/ModuleState";

import {
  deleteManual,
  getPublicManuals,
  manualFileUrl,
  saveManual,
} from "../../services/manuals.service";

import type {
  ManualDocument,
  ManualType,
} from "../../types/manuals";

import "./manuales.css";


interface ManualSlot {
  type: ManualType;
  defaultTitle: string;
  description: string;
}


const MANUAL_SLOTS:
  ManualSlot[] = [
    {
      type:
        "user",

      defaultTitle:
        "Manual de usuario",

      description:
        "Guía de operación para los usuarios de SalesIA Enterprise.",
    },

    {
      type:
        "technical",

      defaultTitle:
        "Manual técnico",

      description:
        "Documentación técnica, arquitectura y mantenimiento del sistema.",
    },
  ];


function formatSize(
  bytes: number,
) {
  if (
    bytes <
    1024 * 1024
  ) {
    return (
      `${(
        bytes / 1024
      ).toFixed(1)} KB`
    );
  }

  return (
    `${(
      bytes
      / 1024
      / 1024
    ).toFixed(2)} MB`
  );
}


function formatDate(
  value: string,
) {
  return new Date(
    value,
  ).toLocaleString(
    "es-PE",

    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    },
  );
}


export default function ManualesPage() {
  const [
    manuals,
    setManuals,
  ] =
    useState<
      ManualDocument[]
    >([]);


  const [
    titles,
    setTitles,
  ] =
    useState<
      Record<
        ManualType,
        string
      >
    >({
      user:
        "Manual de usuario",

      technical:
        "Manual técnico",
    });


  const [
    files,
    setFiles,
  ] =
    useState<
      Record<
        ManualType,
        File | null
      >
    >({
      user:
        null,

      technical:
        null,
    });


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    saving,
    setSaving,
  ] =
    useState<
      ManualType | null
    >(null);


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
    deleting,
    setDeleting,
  ] =
    useState<
      ManualType | null
    >(null);


  const userInput =
    useRef<
      HTMLInputElement | null
    >(null);


  const technicalInput =
    useRef<
      HTMLInputElement | null
    >(null);


  async function loadManuals() {
    setLoading(
      true,
    );

    setError(
      "",
    );

    try {
      const data =
        await getPublicManuals();

      setManuals(
        data,
      );

      setTitles({
        user:
          data.find(
            (
              item,
            ) =>
              item.manual_type ===
              "user",
          )?.title
          ?? "Manual de usuario",

        technical:
          data.find(
            (
              item,
            ) =>
              item.manual_type ===
              "technical",
          )?.title
          ?? "Manual técnico",
      });
    } catch (
      currentError
    ) {
      setError(
        currentError
          instanceof Error
          ? currentError.message
          : "No se pudieron cargar los manuales.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }


  useEffect(
    () => {
      void loadManuals();
    },
    [],
  );


  const byType =
    useMemo(
      () =>
        new Map(
          manuals.map(
            (
              manual,
            ) => [
              manual.manual_type,
              manual,
            ],
          ),
        ),
      [
        manuals,
      ],
    );


  function selectFile(
    type: ManualType,
  ) {
    if (
      type ===
      "user"
    ) {
      userInput.current
        ?.click();

      return;
    }

    technicalInput.current
      ?.click();
  }


  function handleFile(
    type: ManualType,
    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0]
      ?? null;

    event.target.value =
      "";

    if (!file) {
      return;
    }

    if (
      file.type
      !== "application/pdf"
      || !file.name
        .toLowerCase()
        .endsWith(
          ".pdf",
        )
    ) {
      setError(
        "Selecciona un archivo PDF.",
      );

      return;
    }

    if (
      file.size
      > 15 * 1024 * 1024
    ) {
      setError(
        "El PDF no puede superar los 15 MB.",
      );

      return;
    }

    setFiles(
      (
        current,
      ) => ({
        ...current,
        [type]:
          file,
      }),
    );

    setError(
      "",
    );
  }


  async function handleSave(
    type: ManualType,
  ) {
    const current =
      byType.get(
        type,
      );

    const file =
      files[
        type
      ];

    const title =
      titles[
        type
      ].trim();


    if (!title) {
      setError(
        "El título es obligatorio.",
      );

      return;
    }


    if (
      !current
      && !file
    ) {
      setError(
        "Selecciona el PDF que deseas publicar.",
      );

      return;
    }


    setSaving(
      type,
    );

    setError(
      "",
    );

    setSuccess(
      "",
    );


    try {
      await saveManual(
        type,
        title,
        file,
      );

      setFiles(
        (
          previous,
        ) => ({
          ...previous,
          [type]:
            null,
        }),
      );

      setSuccess(
        type ===
          "user"
          ? "Manual de usuario actualizado."
          : "Manual técnico actualizado.",
      );

      await loadManuals();
    } catch (
      currentError
    ) {
      setError(
        currentError
          instanceof Error
          ? currentError.message
          : "No se pudo guardar el manual.",
      );
    } finally {
      setSaving(
        null,
      );
    }
  }


  async function confirmDelete() {
    if (!deleting) {
      return;
    }

    const type =
      deleting;

    setDeleting(
      null,
    );

    setError(
      "",
    );

    setSuccess(
      "",
    );


    try {
      await deleteManual(
        type,
      );

      setSuccess(
        "Manual eliminado correctamente.",
      );

      setFiles(
        (
          current,
        ) => ({
          ...current,
          [type]:
            null,
        }),
      );

      await loadManuals();
    } catch (
      currentError
    ) {
      setError(
        currentError
          instanceof Error
          ? currentError.message
          : "No se pudo eliminar el manual.",
      );
    }
  }


  return (
    <section className="manuals-page">
      <header className="manuals-header">
        <div>
          <span>
            Documentación
          </span>

          <h2>
            Manuales del sistema
          </h2>

          <p>
            Publica los documentos que estarán disponibles
            en modo lectura desde la pantalla de acceso.
          </p>
        </div>

        <div className="manuals-format">
          <FileText
            size={16}
          />

          PDF · máximo 15 MB
        </div>
      </header>


      {error && (
        <ModuleState
          type="error"
          title="No se pudo completar la operación"
          description={
            error
          }
        />
      )}


      {success && (
        <ModuleState
          type="success"
          title="Cambios guardados"
          description={
            success
          }
        />
      )}


      {loading ? (
        <ModuleState
          type="loading"
          title="Cargando manuales"
          description="Consultando la documentación publicada."
        />
      ) : (
        <div className="manuals-grid">
          {MANUAL_SLOTS.map(
            (
              slot,
            ) => {
              const manual =
                byType.get(
                  slot.type,
                );

              const file =
                files[
                  slot.type
                ];

              const isSaving =
                saving ===
                slot.type;


              return (
                <article
                  key={
                    slot.type
                  }
                  className="manual-card"
                >
                  <div className="manual-card-top">
                    <div className="manual-card-icon">
                      <BookOpenText
                        size={23}
                      />
                    </div>

                    <span
                      className={
                        manual
                          ? "manual-status published"
                          : "manual-status empty"
                      }
                    >
                      {manual
                        ? "Publicado"
                        : "Sin documento"}
                    </span>
                  </div>


                  <div className="manual-card-copy">
                    <h3>
                      {
                        slot.defaultTitle
                      }
                    </h3>

                    <p>
                      {
                        slot.description
                      }
                    </p>
                  </div>


                  <label className="manual-title-field">
                    <span>
                      Título visible
                    </span>

                    <input
                      value={
                        titles[
                          slot.type
                        ]
                      }
                      disabled={
                        isSaving
                      }
                      onChange={(
                        event,
                      ) =>
                        setTitles(
                          (
                            current,
                          ) => ({
                            ...current,

                            [slot.type]:
                              event.target.value,
                          }),
                        )
                      }
                    />
                  </label>


                  <div className="manual-file-panel">
                    <FileText
                      size={19}
                    />

                    <div>
                      <strong>
                        {file
                          ? file.name
                          : manual
                            ? manual.file_name
                            : "Ningún PDF seleccionado"}
                      </strong>

                      <span>
                        {file
                          ? formatSize(
                              file.size,
                            )
                          : manual
                            ? `${formatSize(
                                manual.size_bytes,
                              )} · ${formatDate(
                                manual.updated_at,
                              )}`
                            : "Selecciona un PDF para publicarlo."}
                      </span>
                    </div>
                  </div>


                  <input
                    ref={
                      slot.type ===
                        "user"
                        ? userInput
                        : technicalInput
                    }
                    className="manual-hidden-input"
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(
                      event,
                    ) =>
                      handleFile(
                        slot.type,
                        event,
                      )
                    }
                  />


                  <div className="manual-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={
                        isSaving
                      }
                      onClick={() =>
                        selectFile(
                          slot.type,
                        )
                      }
                    >
                      {manual
                        ? (
                          <FilePenLine
                            size={15}
                          />
                        )
                        : (
                          <FilePlus2
                            size={15}
                          />
                        )}

                      {manual
                        ? "Reemplazar PDF"
                        : "Agregar PDF"}
                    </button>


                    {manual && (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                          window.open(
                            manualFileUrl(
                              slot.type,
                            ),
                            "_blank",
                            "noopener,noreferrer",
                          )
                        }
                      >
                        <BookOpenText
                          size={15}
                        />

                        Ver
                      </button>
                    )}


                    <button
                      type="button"
                      className="primary-button"
                      disabled={
                        isSaving
                      }
                      onClick={() =>
                        void handleSave(
                          slot.type,
                        )
                      }
                    >
                      <Save
                        size={15}
                      />

                      {isSaving
                        ? "Guardando..."
                        : "Guardar cambios"}
                    </button>


                    {manual && (
                      <button
                        type="button"
                        className="manual-delete-button"
                        disabled={
                          isSaving
                        }
                        onClick={() =>
                          setDeleting(
                            slot.type,
                          )
                        }
                      >
                        <Trash2
                          size={15}
                        />

                        Eliminar
                      </button>
                    )}
                  </div>
                </article>
              );
            },
          )}
        </div>
      )}


      <ConfirmDialog
        open={
          deleting !==
          null
        }
        title="Eliminar manual"
        message="El documento dejará de estar disponible en la pantalla de inicio de sesión. ¿Deseas continuar?"
        onCancel={() =>
          setDeleting(
            null,
          )
        }
        onConfirm={() =>
          void confirmDelete()
        }
      />
    </section>
  );
}
