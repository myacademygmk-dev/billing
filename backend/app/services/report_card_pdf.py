from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from app.services.bill_pdf import InstitutionBranding


@dataclass
class MarkEntry:
    subject: str
    marks_obtained: Decimal
    max_marks: int
    grade: str | None = None


def render_report_card_pdf(
    *,
    student_name: str,
    student_code: str,
    class_name: str,
    exam_name: str,
    marks: list[MarkEntry],
    total_obtained: Decimal,
    total_max: int,
    percentage: float,
    rank: str | None = None,
    remarks: str | None = None,
    branding: InstitutionBranding | None = None,
) -> bytes:
    if branding is None:
        branding = InstitutionBranding()

    def esc(value: str) -> str:
        return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

    lines: list[tuple[str, int, int, int, str]] = [
        ("F2", 20, 180, 760, branding.name),
        ("F1", 11, 200, 742, branding.tagline),
        ("F1", 9, 50, 724, branding.registration_no),
        ("F2", 14, 210, 690, "REPORT CARD"),
        ("F1", 11, 50, 655, f"Student : {student_name}"),
        ("F1", 11, 350, 655, f"Roll No : {student_code}"),
        ("F1", 11, 50, 635, f"Class : {class_name}"),
        ("F1", 11, 350, 635, f"Exam : {exam_name}"),
    ]

    # Table header
    y = 600
    lines.append(("F2", 10, 50, y, "SUBJECT"))
    lines.append(("F2", 10, 300, y, "MARKS"))
    lines.append(("F2", 10, 400, y, "MAX"))
    lines.append(("F2", 10, 480, y, "GRADE"))
    y -= 5

    # Table rows
    for mark in marks:
        y -= 22
        lines.append(("F1", 10, 50, y, esc(mark.subject)))
        lines.append(("F1", 10, 310, y, str(mark.marks_obtained)))
        lines.append(("F1", 10, 410, y, str(mark.max_marks)))
        lines.append(("F1", 10, 485, y, mark.grade or "-"))

    # Totals
    y -= 30
    lines.append(("F2", 11, 50, y, f"TOTAL : {total_obtained} / {total_max}"))
    lines.append(("F2", 11, 300, y, f"PERCENTAGE : {percentage:.1f}%"))
    if rank:
        lines.append(("F2", 11, 450, y, f"RANK : {rank}"))

    if remarks:
        y -= 25
        lines.append(("F1", 10, 50, y, f"Remarks : {remarks}"))

    # Footer
    y -= 40
    lines.append(("F1", 9, 50, y, "This is a computer-generated report card."))

    bottom = max(100, y - 20)

    content = [
        "0.2 w",
        f"36 {bottom} 540 {724 - bottom} re S",
        "36 710 540 0 re S",
        "36 670 540 0 re S",
        f"36 {600 - 2} 540 0 re S",
        "BT",
    ]
    for font, size, x, y_pos, text in lines:
        content.append(f"/{font} {size} Tf")
        content.append(f"1 0 0 1 {x} {y_pos} Tm")
        content.append(f"({esc(text)}) Tj")
    content.append("ET")
    stream = "\n".join(content).encode("ascii")

    objects: list[bytes] = []
    objects.append(b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n")
    objects.append(b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n")
    objects.append(
        b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        b"/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >> endobj\n"
    )
    objects.append(b"4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n")
    objects.append(b"5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj\n")
    objects.append(f"6 0 obj << /Length {len(stream)} >> stream\n".encode("ascii") + stream + b"\nendstream endobj\n")

    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for obj in objects:
        offsets.append(len(pdf))
        pdf.extend(obj)
    xref_start = len(pdf)
    pdf.extend(f"xref\n0 {len(offsets)}\n".encode("ascii"))
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
    pdf.extend(
        f"trailer << /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref_start}\n%%EOF".encode("ascii")
    )
    return bytes(pdf)
