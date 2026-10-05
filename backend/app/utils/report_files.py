import csv
import html
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parents[2]

REPORTS_DIR = (
    BASE_DIR /
    "storage" /
    "reports"
)

REPORTS_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


def _stringify(value: Any) -> str:
    if value is None:
        return ""

    return str(value)


def generate_csv(
    report_id: str,
    rows: list[dict],
) -> Path:
    file_path = (
        REPORTS_DIR /
        f"{report_id}.csv"
    )

    if not rows:
        headers = ["resultado"]

        with file_path.open(
            "w",
            newline="",
            encoding="utf-8-sig",
        ) as file:
            writer = csv.writer(file)
            writer.writerow(headers)
            writer.writerow(
                ["Sin datos para los filtros seleccionados"]
            )

        return file_path

    headers = list(rows[0].keys())

    with file_path.open(
        "w",
        newline="",
        encoding="utf-8-sig",
    ) as file:
        writer = csv.writer(file)

        writer.writerow(headers)

        for row in rows:
            writer.writerow([
                _stringify(
                    row.get(header)
                )
                for header in headers
            ])

    return file_path