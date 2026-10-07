export type ExportRow =
  Record<
    string,
    string | number | boolean | null | undefined
  >;


function normalizeFilename(
  filename: string,
  extension: string,
) {
  const clean =
    filename
      .trim()
      .replace(
        /[\\/:*?"<>|]+/g,
        "-",
      )
      .replace(
        /\s+/g,
        "-",
      );

  return clean
    .toLowerCase()
    .endsWith(
      `.${extension.toLowerCase()}`,
    )
      ? clean
      : `${clean}.${extension}`;
}


function safeSpreadsheetValue(
  value:
    | string
    | number
    | boolean
    | null
    | undefined,
) {
  if (
    value === null
    || value === undefined
  ) {
    return "";
  }

  if (
    typeof value !== "string"
  ) {
    return value;
  }

  if (
    /^[=+@-]/.test(value)
  ) {
    return `'${value}`;
  }

  return value;
}


function sanitizedRows(
  rows: ExportRow[],
) {
  return rows.map(
    (row) =>
      Object.fromEntries(
        Object.entries(
          row,
        ).map(
          ([key, value]) => [
            key,
            safeSpreadsheetValue(
              value,
            ),
          ],
        ),
      ),
  );
}


export function saveFile(
  file: Blob,
  filename: string,
) {
  const url =
    URL.createObjectURL(
      file,
    );

  const anchor =
    document.createElement(
      "a",
    );

  anchor.href =
    url;

  anchor.download =
    filename;

  document.body.appendChild(
    anchor,
  );

  anchor.click();

  anchor.remove();

  window.setTimeout(
    () =>
      URL.revokeObjectURL(
        url,
      ),
    1000,
  );
}


export function exportRowsToCsv(
  filename: string,
  rows: ExportRow[],
) {
  if (
    rows.length === 0
  ) {
    throw new Error(
      "No hay datos para exportar.",
    );
  }

  const cleanRows =
    sanitizedRows(
      rows,
    );

  const headers =
    Object.keys(
      cleanRows[0],
    );

  function escapeCsv(
    value: unknown,
  ) {
    const text =
      String(
        value ?? "",
      );

    return `"${text.replace(
      /"/g,
      '""',
    )}"`;
  }

  const lines = [
    headers
      .map(
        escapeCsv,
      )
      .join(","),

    ...cleanRows.map(
      (row) =>
        headers
          .map(
            (header) =>
              escapeCsv(
                row[header],
              ),
          )
          .join(","),
    ),
  ];

  const blob =
    new Blob(
      [
        "\uFEFF",
        lines.join(
          "\r\n",
        ),
      ],
      {
        type:
          "text/csv;charset=utf-8;",
      },
    );

  saveFile(
    blob,
    normalizeFilename(
      filename,
      "csv",
    ),
  );
}


export async function exportRowsToExcel(
  filename: string,
  sheetName: string,
  rows: ExportRow[],
) {
  if (
    rows.length === 0
  ) {
    throw new Error(
      "No hay datos para exportar.",
    );
  }

  const XLSX =
    await import(
      "xlsx"
    );

  const cleanRows =
    sanitizedRows(
      rows,
    );

  const worksheet =
    XLSX.utils.json_to_sheet(
      cleanRows,
    );

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    sheetName.slice(
      0,
      31,
    ),
  );

  const output =
    XLSX.write(
      workbook,
      {
        bookType: "xlsx",
        type: "array",
      },
    );

  const blob =
    new Blob(
      [output],
      {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    );

  saveFile(
    blob,
    normalizeFilename(
      filename,
      "xlsx",
    ),
  );
}


export async function createVisualPdfFile(
  element: HTMLElement,
  filename: string,
) {
  const [
    html2canvasModule,
    jspdfModule,
  ] =
    await Promise.all([
      import(
        "html2canvas"
      ),
      import(
        "jspdf"
      ),
    ]);

  const html2canvas =
    html2canvasModule.default;

  const {
    jsPDF,
  } =
    jspdfModule;


  await document.fonts.ready;


  const canvas =
    await html2canvas(
      element,
      {
        scale: 2,

        useCORS: true,

        backgroundColor:
          "#ffffff",

        logging: false,

        scrollX: 0,

        scrollY:
          -window.scrollY,

        windowWidth:
          Math.max(
            element.scrollWidth,
            element.clientWidth,
          ),

        windowHeight:
          Math.max(
            element.scrollHeight,
            element.clientHeight,
          ),

        onclone: (
          clonedDocument,
        ) => {
          clonedDocument
            .querySelectorAll(
              '[data-export-hide="true"]',
            )
            .forEach(
              (node) => {
                (
                  node as HTMLElement
                ).style.display =
                  "none";
              },
            );
        },
      },
    );


  const pdf =
    new jsPDF({
      orientation:
        canvas.width >
        canvas.height
          ? "landscape"
          : "portrait",

      unit: "mm",

      format: "a4",
    });


  const pageWidth =
    pdf.internal
      .pageSize
      .getWidth();

  const pageHeight =
    pdf.internal
      .pageSize
      .getHeight();

  const margin =
    8;

  const printableWidth =
    pageWidth -
    margin * 2;

  const printableHeight =
    pageHeight -
    margin * 2;

  const imageWidth =
    printableWidth;

  const imageHeight =
    canvas.height
    * imageWidth
    / canvas.width;

  const image =
    canvas.toDataURL(
      "image/png",
      1,
    );


  let renderedHeight =
    0;


  pdf.addImage(
    image,
    "PNG",
    margin,
    margin,
    imageWidth,
    imageHeight,
    undefined,
    "FAST",
  );


  renderedHeight +=
    printableHeight;


  while (
    renderedHeight <
    imageHeight
  ) {
    pdf.addPage();

    pdf.addImage(
      image,
      "PNG",
      margin,
      margin -
        renderedHeight,
      imageWidth,
      imageHeight,
      undefined,
      "FAST",
    );

    renderedHeight +=
      printableHeight;
  }


  const blob =
    pdf.output(
      "blob",
    );


  return new File(
    [blob],
    normalizeFilename(
      filename,
      "pdf",
    ),
    {
      type:
        "application/pdf",
    },
  );
}


export async function downloadVisualPdf(
  element: HTMLElement,
  filename: string,
) {
  const file =
    await createVisualPdfFile(
      element,
      filename,
    );

  saveFile(
    file,
    file.name,
  );

  return file;
}


export type ShareResult =
  | "shared"
  | "downloaded"
  | "cancelled";


export async function shareFile(
  file: File,
  title: string,
  text: string,
): Promise<ShareResult> {
  const shareData:
    ShareData = {
      title,
      text,
      files: [
        file,
      ],
    };


  try {
    if (
      navigator.share
      && (
        !navigator.canShare
        || navigator.canShare(
          shareData,
        )
      )
    ) {
      await navigator.share(
        shareData,
      );

      return "shared";
    }
  } catch (error) {
    if (
      error instanceof DOMException
      && error.name ===
        "AbortError"
    ) {
      return "cancelled";
    }

    throw error;
  }


  saveFile(
    file,
    file.name,
  );

  return "downloaded";
}


export function exportDateStamp() {
  return new Date()
    .toISOString()
    .slice(
      0,
      10,
    );
}
