import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ChevronDown,
  FileDown,
  FileSpreadsheet,
  FileText,
  Share2,
} from "lucide-react";

import "./ExportActions.css";


interface ExportActionsProps {
  onPdf:
    () =>
      void | Promise<void>;

  onCsv:
    () =>
      void | Promise<void>;

  onExcel:
    () =>
      void | Promise<void>;

  onShare:
    () =>
      void | Promise<void>;

  disabled?: boolean;
}


export default function ExportActions({
  onPdf,
  onCsv,
  onExcel,
  onShare,
  disabled = false,
}: ExportActionsProps) {
  const [
    open,
    setOpen,
  ] =
    useState(false);

  const [
    busy,
    setBusy,
  ] =
    useState(false);

  const rootRef =
    useRef<HTMLDivElement>(
      null,
    );


  useEffect(
    () => {
      function handleOutside(
        event: MouseEvent,
      ) {
        if (
          rootRef.current
          && !rootRef.current.contains(
            event.target as Node,
          )
        ) {
          setOpen(
            false,
          );
        }
      }

      document.addEventListener(
        "mousedown",
        handleOutside,
      );

      return () =>
        document.removeEventListener(
          "mousedown",
          handleOutside,
        );
    },
    [],
  );


  async function run(
    action:
      () =>
        void
        | Promise<void>,
  ) {
    setOpen(
      false,
    );

    setBusy(
      true,
    );

    try {
      await action();
    } finally {
      setBusy(
        false,
      );
    }
  }


  return (
    <div
      ref={rootRef}
      className="export-actions"
      data-export-hide="true"
    >
      <div className="export-menu-wrap">
        <button
          type="button"
          className="export-button"
          disabled={
            disabled
            || busy
          }
          onClick={() =>
            setOpen(
              (value) =>
                !value,
            )
          }
        >
          <FileDown
            size={15}
          />

          {busy
            ? "Preparando..."
            : "Exportar"}

          <ChevronDown
            size={13}
          />
        </button>


        {open && (
          <div className="export-menu">
            <button
              type="button"
              onClick={() =>
                void run(
                  onPdf,
                )
              }
            >
              <FileText
                size={15}
              />

              <span>
                <strong>
                  PDF
                </strong>

                <small>
                  Vista visual
                </small>
              </span>
            </button>


            <button
              type="button"
              onClick={() =>
                void run(
                  onCsv,
                )
              }
            >
              <FileSpreadsheet
                size={15}
              />

              <span>
                <strong>
                  CSV
                </strong>

                <small>
                  Datos filtrados
                </small>
              </span>
            </button>


            <button
              type="button"
              onClick={() =>
                void run(
                  onExcel,
                )
              }
            >
              <FileSpreadsheet
                size={15}
              />

              <span>
                <strong>
                  Excel
                </strong>

                <small>
                  Archivo XLSX
                </small>
              </span>
            </button>
          </div>
        )}
      </div>


      <button
        type="button"
        className="share-button"
        disabled={
          disabled
          || busy
        }
        onClick={() =>
          void run(
            onShare,
          )
        }
      >
        <Share2
          size={15}
        />

        Compartir
      </button>
    </div>
  );
}
