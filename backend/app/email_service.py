import os
from urllib.parse import quote

import resend
from dotenv import load_dotenv


load_dotenv()


def send_password_reset_email(
    to_email: str,
    token: str,
) -> None:
    api_key = os.getenv("RESEND_API_KEY")

    if not api_key:
        raise RuntimeError(
            "Falta RESEND_API_KEY en .env"
        )

    resend.api_key = api_key

    frontend_url = os.getenv(
        "FRONTEND_URL",
        "http://localhost:3000",
    )

    email_from = os.getenv(
        "EMAIL_FROM",
        "Mi App <onboarding@resend.dev>",
    )

    encoded_token = quote(token, safe="")

    reset_url = (
        f"{frontend_url}/reset-password"
        f"?token={encoded_token}"
    )

    resend.Emails.send(
        {
            "from": email_from,
            "to": [to_email],
            "subject": "Restablecer contraseña",
            "html": f"""
                <h2>Restablecer contraseña</h2>

                <p>
                    Recibimos una solicitud para cambiar
                    tu contraseña.
                </p>

                <p>
                    El enlace vence en 30 minutos.
                </p>

                <p>
                    <a href="{reset_url}">
                        Restablecer contraseña
                    </a>
                </p>

                <p>
                    Si no solicitaste el cambio,
                    ignora este email.
                </p>
            """,
        }
    )
