import asyncio
import aiosmtplib
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from agent.core.config import (
    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, APP_URL,
    RESEND_API_KEY, FROM_EMAIL,
)


async def send_invite_email(to_email: str, inviter_email: str, trip_name: str, invite_token: str) -> bool:
    """Send a trip invite email. Prefers Resend HTTP API, falls back to SMTP.

    Returns False (and logs) if no sender is configured or sending fails.
    """
    invite_url = f"{APP_URL.rstrip('/')}/invite/{invite_token}"
    subject = f"{inviter_email} invited you to a trip on PlanCation"

    text = (
        f"Hi!\n\n"
        f"{inviter_email} has invited you to collaborate on \"{trip_name}\" on PlanCation.\n\n"
        f"Accept or decline the invite here: {invite_url}\n\n"
        f"— The PlanCation Team"
    )
    html = (
        f"<html><body>"
        f"<p>Hi!</p>"
        f"<p><strong>{inviter_email}</strong> has invited you to collaborate on the trip "
        f"<strong>\"{trip_name}\"</strong> on PlanCation.</p>"
        f"<p><a href=\"{invite_url}\">Click here to accept or decline the invite</a></p>"
        f"<br><p>— The PlanCation Team</p>"
        f"</body></html>"
    )

    from_addr = FROM_EMAIL or SMTP_USER or "onboarding@resend.dev"

    # Prefer Resend HTTP API if configured — works on hosts that block outbound SMTP
    if RESEND_API_KEY:
        return await _send_via_resend(from_addr, to_email, subject, text, html)

    # Fallback to direct SMTP
    return await _send_via_smtp(from_addr, to_email, subject, text, html)


async def _send_via_resend(from_addr: str, to_email: str, subject: str, text: str, html: str) -> bool:
    def _sync():
        return requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": from_addr,
                "to": [to_email],
                "subject": subject,
                "text": text,
                "html": html,
            },
            timeout=10,
        )
    try:
        resp = await asyncio.to_thread(_sync)
        if resp.ok:
            return True
        print(f"[send_invite_email] Resend returned {resp.status_code} for {to_email}: {resp.text}")
        return False
    except Exception as e:
        print(f"[send_invite_email] Resend error for {to_email}: {e}")
        return False


async def _send_via_smtp(from_addr: str, to_email: str, subject: str, text: str, html: str) -> bool:
    if not all([SMTP_HOST, SMTP_USER, SMTP_PASSWORD]):
        print(f"[send_invite_email] No email transport configured (set RESEND_API_KEY or SMTP_*), skipping email to {to_email}")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = to_email
    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
            start_tls=True,
        )
        return True
    except Exception as e:
        print(f"[send_invite_email] SMTP failed to send to {to_email}: {e}")
        return False
