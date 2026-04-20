import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from agent.core.config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, APP_URL


async def send_invite_email(to_email: str, inviter_email: str, trip_name: str) -> bool:
    """Send a trip invite email. Returns False silently if SMTP is not configured."""
    if not all([SMTP_HOST, SMTP_USER, SMTP_PASSWORD]):
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"{inviter_email} invited you to a trip on PlanCation"
    msg["From"] = SMTP_USER
    msg["To"] = to_email

    text = (
        f"Hi!\n\n"
        f"{inviter_email} has invited you to collaborate on \"{trip_name}\" on PlanCation.\n\n"
        f"Sign in at {APP_URL} to view the trip.\n\n"
        f"— The PlanCation Team"
    )
    html = (
        f"<html><body>"
        f"<p>Hi!</p>"
        f"<p><strong>{inviter_email}</strong> has invited you to collaborate on the trip "
        f"<strong>\"{trip_name}\"</strong> on PlanCation.</p>"
        f"<p><a href=\"{APP_URL}\">Click here to sign in and view the trip</a></p>"
        f"<br><p>— The PlanCation Team</p>"
        f"</body></html>"
    )
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
    except Exception:
        return False
