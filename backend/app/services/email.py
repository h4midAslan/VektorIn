import httpx
import logging
from app.config import settings

logger = logging.getLogger(__name__)


def send_verification_code(to_email: str, code: str) -> bool:
    html = f"""<!DOCTYPE html>
<html lang="az">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff">
    <tr><td align="center" style="padding:40px 16px">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%">
        <tr><td style="padding-bottom:24px;border-bottom:1px solid #e5e7eb">
          <span style="font-size:20px;font-weight:700;color:#1d4ed8">Hash</span>
          <span style="font-size:14px;color:#6b7280;margin-left:8px">hashcampus.site</span>
        </td></tr>
        <tr><td style="padding:32px 0 16px">
          <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111827">Email təsdiq kodu</p>
          <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6">
            Qeydiyyatı tamamlamaq üçün aşağıdakı 6 rəqəmli kodu daxil edin.
            Kod <strong>10 dəqiqə</strong> ərzində etibarlıdır.
          </p>
        </td></tr>
        <tr><td style="padding:8px 0 32px">
          <div style="display:inline-block;background:#f3f4f6;border-radius:8px;padding:16px 32px">
            <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#111827;font-family:monospace">{code}</span>
          </div>
        </td></tr>
        <tr><td style="padding-top:24px;border-top:1px solid #e5e7eb">
          <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6">
            Bu kodu heç kimlə paylaşmayın. Əgər bu sorğunu siz göndərməmisinizsə, bu emaili nəzərə almayın.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""
    try:
        res = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
            json={
                "from": "Hash <noreply@hashcampus.site>",
                "to": [to_email],
                "subject": "Hash hesabınızı aktivləşdirin",
                "html": html,
            },
            timeout=10,
        )
        print(f"[EMAIL] Resend response for {to_email}: status={res.status_code} body={res.text}", flush=True)
        if res.status_code in (200, 201):
            return True
        return False
    except Exception as e:
        print(f"[EMAIL] Exception for {to_email}: {e}", flush=True)
        return False
