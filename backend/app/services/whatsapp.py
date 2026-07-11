"""WhatsApp integration helpers — generates message templates and deep links."""
from __future__ import annotations

from urllib.parse import quote


def whatsapp_fee_reminder_message(
    student_name: str,
    pending_amount: str,
    institute_name: str = "MY Academy",
    phone: str = "044-43568296",
) -> str:
    return (
        f"Dear Parent,\n\n"
        f"This is a gentle reminder that the fee for *{student_name}* is pending.\n"
        f"Pending Amount: ₹{pending_amount}\n\n"
        f"Kindly clear the dues at the earliest.\n\n"
        f"Thank you,\n{institute_name}\n{phone}"
    )


def whatsapp_birthday_message(student_name: str, institute_name: str = "MY Academy") -> str:
    return (
        f"🎂 Happy Birthday *{student_name}*! 🎉\n\n"
        f"Wishing you a wonderful year ahead filled with success and happiness.\n\n"
        f"With love,\n{institute_name} Family"
    )


def whatsapp_deep_link(phone: str, message: str) -> str:
    """Generate wa.me link for sending WhatsApp message."""
    # Clean phone number
    clean = phone.replace(" ", "").replace("-", "").replace("+", "")
    if len(clean) == 10:
        clean = "91" + clean
    return f"https://wa.me/{clean}?text={quote(message)}"


def whatsapp_receipt_message(
    student_name: str,
    receipt_no: str,
    amount: str,
    fee_period: str,
    institute_name: str = "MY Academy",
) -> str:
    return (
        f"✅ *Fee Payment Received*\n\n"
        f"Student: {student_name}\n"
        f"Receipt No: {receipt_no}\n"
        f"Amount: ₹{amount}\n"
        f"Period: {fee_period}\n\n"
        f"Thank you for the payment.\n{institute_name}"
    )
