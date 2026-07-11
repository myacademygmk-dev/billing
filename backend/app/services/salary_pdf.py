from __future__ import annotations

from app.services.bill_pdf import InstitutionBranding


def render_salary_slip_pdf(
    *,
    staff_name: str,
    staff_code: str,
    designation: str,
    month: str,
    salary: str,
    deductions: str,
    net_amount: str,
    mode: str,
    paid_date: str,
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
        ("F2", 14, 220, 690, "SALARY SLIP"),
        ("F1", 11, 50, 650, f"Staff Name : {staff_name}"),
        ("F1", 11, 330, 650, f"Staff Code : {staff_code}"),
        ("F1", 11, 50, 625, f"Designation : {designation}"),
        ("F1", 11, 330, 625, f"Month : {month}"),
        ("F1", 11, 50, 590, f"Gross Salary : {salary}"),
        ("F1", 11, 330, 590, f"Deductions : {deductions}"),
        ("F2", 12, 50, 555, f"Net Amount : {net_amount}"),
        ("F1", 11, 50, 525, f"Payment Mode : {mode.upper()}"),
        ("F1", 11, 330, 525, f"Paid Date : {paid_date}"),
        ("F1", 9, 50, 480, "This is a computer-generated payslip. No signature required."),
    ]

    content = [
        "0.2 w",
        "36 470 540 320 re S",
        "36 710 540 0 re S",
        "36 640 540 0 re S",
        "36 575 540 0 re S",
        "BT",
    ]
    for font, size, x, y, text in lines:
        content.append(f"/{font} {size} Tf")
        content.append(f"1 0 0 1 {x} {y} Tm")
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
