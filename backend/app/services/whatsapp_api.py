"""
WhatsApp Cloud API Integration.

Uses Meta's WhatsApp Business Cloud API to send messages directly.
Requires:
  - WHATSAPP_PHONE_NUMBER_ID: Your WhatsApp Business phone number ID
  - WHATSAPP_ACCESS_TOKEN: Permanent access token from Meta Business Manager
  
Set these in .env file.
"""
from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

WHATSAPP_API_URL = "https://graph.facebook.com/v21.0"


def _get_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.whatsapp_access_token}",
        "Content-Type": "application/json",
    }


def _format_phone(phone: str) -> str:
    """Format phone to international format (91XXXXXXXXXX)."""
    clean = phone.replace(" ", "").replace("-", "").replace("+", "").replace("(", "").replace(")", "")
    if len(clean) == 10:
        clean = "91" + clean
    return clean


async def send_text_message(to_phone: str, message: str) -> dict[str, Any]:
    """Send a plain text message via WhatsApp Cloud API."""
    if not settings.whatsapp_phone_number_id or not settings.whatsapp_access_token:
        logger.warning("WhatsApp API not configured. Skipping message send.")
        return {"status": "skipped", "reason": "not_configured"}

    phone = _format_phone(to_phone)
    url = f"{WHATSAPP_API_URL}/{settings.whatsapp_phone_number_id}/messages"
    
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "text",
        "text": {"body": message}
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(url, json=payload, headers=_get_headers())
            data = response.json()
            if response.status_code == 200:
                logger.info("WhatsApp message sent to %s", phone)
                return {"status": "sent", "data": data}
            else:
                logger.error("WhatsApp API error: %s", data)
                return {"status": "error", "error": data}
    except Exception as e:
        logger.error("WhatsApp send failed: %s", str(e))
        return {"status": "error", "error": str(e)}


async def send_receipt_message(
    to_phone: str,
    student_name: str,
    receipt_no: str,
    amount: str,
    fee_period: str,
    mode: str = "",
    institute_name: str = "MY Academy",
) -> dict[str, Any]:
    """Send fee receipt via WhatsApp after payment."""
    message = (
        f"✅ *Fee Payment Received*\n\n"
        f"🏫 {institute_name}\n"
        f"━━━━━━━━━━━━━━━\n"
        f"👤 Student: *{student_name}*\n"
        f"🧾 Receipt: {receipt_no}\n"
        f"💰 Amount: *₹{amount}*\n"
        f"📅 Period: {fee_period}\n"
        f"💳 Mode: {mode.upper()}\n"
        f"━━━━━━━━━━━━━━━\n\n"
        f"Thank you for the payment! 🙏"
    )
    return await send_text_message(to_phone, message)


async def send_fee_reminder(
    to_phone: str,
    student_name: str,
    pending_amount: str,
    pending_months: str = "",
    institute_name: str = "MY Academy",
) -> dict[str, Any]:
    """Send fee reminder to parent."""
    message = (
        f"📢 *Fee Reminder*\n\n"
        f"Dear Parent,\n\n"
        f"This is a gentle reminder regarding pending fees for *{student_name}*.\n\n"
        f"💰 Pending: *₹{pending_amount}*\n"
    )
    if pending_months:
        message += f"📅 Months: {pending_months}\n"
    message += (
        f"\nKindly clear the dues at your earliest convenience.\n\n"
        f"Thank you,\n{institute_name}\n"
        f"📞 044-4356 8296"
    )
    return await send_text_message(to_phone, message)


async def send_leave_notification(
    to_phone: str,
    student_name: str,
    leave_date: str,
    reason: str = "",
    institute_name: str = "MY Academy",
) -> dict[str, Any]:
    """Send leave notification to parent."""
    message = (
        f"📋 *Leave Notification*\n\n"
        f"Student: *{student_name}*\n"
        f"Date: {leave_date}\n"
    )
    if reason:
        message += f"Reason: {reason}\n"
    message += f"\n— {institute_name}"
    return await send_text_message(to_phone, message)


async def send_announcement(
    to_phone: str,
    title: str,
    message_body: str,
    institute_name: str = "MY Academy",
) -> dict[str, Any]:
    """Send general announcement/ad to parent."""
    message = (
        f"📣 *{title}*\n\n"
        f"{message_body}\n\n"
        f"— {institute_name}"
    )
    return await send_text_message(to_phone, message)


def send_text_message_sync(to_phone: str, message: str) -> dict[str, Any]:
    """Synchronous version for use in non-async contexts."""
    if not settings.whatsapp_phone_number_id or not settings.whatsapp_access_token:
        return {"status": "skipped", "reason": "not_configured"}

    phone = _format_phone(to_phone)
    url = f"{WHATSAPP_API_URL}/{settings.whatsapp_phone_number_id}/messages"
    
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "text",
        "text": {"body": message}
    }

    try:
        with httpx.Client(timeout=15) as client:
            response = client.post(url, json=payload, headers=_get_headers())
            data = response.json()
            if response.status_code == 200:
                logger.info("WhatsApp message sent to %s", phone)
                return {"status": "sent", "data": data}
            else:
                logger.error("WhatsApp API error: %s", data)
                return {"status": "error", "error": data}
    except Exception as e:
        logger.error("WhatsApp send failed: %s", str(e))
        return {"status": "error", "error": str(e)}
