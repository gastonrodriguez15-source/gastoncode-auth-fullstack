from datetime import datetime, timedelta, timezone

from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from jose import JWTError
from tinydb import Query

from app.db import reset_tokens, users
from app.email_service import send_password_reset_email
from app.schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    LoginResponse,
    MessageResponse,
    ProfileUpdate,
    ResetPasswordRequest,
    UserCreate,
    UserPublic,
)
from app.security import (
    create_access_token,
    create_reset_token,
    decode_access_token,
    hash_password,
    hash_reset_token,
    verify_password,
)


app = FastAPI(
    title="Auth Full Stack API",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


bearer = HTTPBearer(
    auto_error=False,
)

UserQuery = Query()
ResetQuery = Query()


def public_user(user) -> dict:
    return {
        "id": user.doc_id,
        "email": user["email"],
        "name": user.get("name", ""),
        "phone": user.get("phone", ""),
        "address": user.get("address", ""),
    }


def find_user_by_email(email: str):
    results = users.search(
        UserQuery.email == email.lower()
    )

    if not results:
        return None

    return results[0]


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer
    ),
):
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado.",
        )

    try:
        payload = decode_access_token(
            credentials.credentials
        )

        user_id = int(payload["sub"])

    except (JWTError, KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado.",
        )

    user = users.get(
        doc_id=user_id
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado.",
        )

    return user


@app.get("/")
def root():
    return {
        "message": "API funcionando"
    }


@app.post(
    "/auth/register",
    response_model=UserPublic,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: UserCreate,
):
    existing_user = find_user_by_email(
        payload.email
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado.",
        )

    user_id = users.insert(
        {
            "email": payload.email.lower(),
            "password_hash": hash_password(
                payload.password
            ),
            "name": payload.name,
            "phone": payload.phone,
            "address": payload.address,
        }
    )

    user = users.get(
        doc_id=user_id
    )

    return public_user(user)


@app.post(
    "/auth/login",
    response_model=LoginResponse,
)
def login(
    payload: LoginRequest,
):
    user = find_user_by_email(
        payload.email
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos.",
        )

    if not verify_password(
        payload.password,
        user["password_hash"],
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos.",
        )

    access_token = create_access_token(
        user_id=user.doc_id,
        email=user["email"],
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": public_user(user),
    }


@app.get(
    "/auth/me",
    response_model=UserPublic,
)
def me(
    current_user=Depends(
        get_current_user
    ),
):
    return public_user(
        current_user
    )


@app.put(
    "/profiles/me",
    response_model=UserPublic,
)
def update_profile(
    payload: ProfileUpdate,
    current_user=Depends(
        get_current_user
    ),
):
    changes = payload.model_dump(
        exclude_none=True
    )

    users.update(
        changes,
        doc_ids=[current_user.doc_id],
    )

    updated_user = users.get(
        doc_id=current_user.doc_id
    )

    return public_user(
        updated_user
    )


@app.post(
    "/auth/change-password",
    response_model=MessageResponse,
)
def change_password(
    payload: ChangePasswordRequest,
    current_user=Depends(
        get_current_user
    ),
):
    if not verify_password(
        payload.current_password,
        current_user["password_hash"],
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta.",
        )

    users.update(
        {
            "password_hash": hash_password(
                payload.new_password
            )
        },
        doc_ids=[current_user.doc_id],
    )

    return {
        "message": "Contraseña actualizada correctamente."
    }


@app.post(
    "/auth/forgot-password",
    response_model=MessageResponse,
)
def forgot_password(
    payload: ForgotPasswordRequest,
):
    generic_message = (
        "Si esa dirección está registrada, "
        "recibirás un enlace en breve."
    )

    user = find_user_by_email(
        payload.email
    )

    if not user:
        return {
            "message": generic_message
        }

    now = datetime.now(
        timezone.utc
    )

    previous_tokens = reset_tokens.search(
        (ResetQuery.user_id == user.doc_id)
        & (ResetQuery.used == False)
    )

    for previous_token in previous_tokens:
        reset_tokens.update(
            {
                "used": True
            },
            doc_ids=[previous_token.doc_id],
        )

    raw_token = create_reset_token()

    reset_tokens.insert(
        {
            "user_id": user.doc_id,
            "token_hash": hash_reset_token(
                raw_token
            ),
            "expires_at": (
                now + timedelta(minutes=30)
            ).isoformat(),
            "used": False,
        }
    )

    try:
        send_password_reset_email(
            to_email=user["email"],
            token=raw_token,
        )

    except Exception as error:
        print(
            "Error enviando email:",
            error,
        )

    return {
        "message": generic_message
    }


@app.post(
    "/auth/reset-password",
    response_model=MessageResponse,
)
def reset_password(
    payload: ResetPasswordRequest,
):
    token_hash = hash_reset_token(
        payload.token
    )

    matches = reset_tokens.search(
        ResetQuery.token_hash == token_hash
    )

    if not matches:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido.",
        )

    reset_token = matches[0]

    if reset_token.get("used") is True:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El token ya fue utilizado.",
        )

    expires_at = datetime.fromisoformat(
        reset_token["expires_at"]
    )

    now = datetime.now(
        timezone.utc
    )

    if expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El token expiró.",
        )

    user = users.get(
        doc_id=reset_token["user_id"]
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido.",
        )

    users.update(
        {
            "password_hash": hash_password(
                payload.new_password
            )
        },
        doc_ids=[user.doc_id],
    )

    reset_tokens.update(
        {
            "used": True
        },
        doc_ids=[reset_token.doc_id],
    )

    other_tokens = reset_tokens.search(
        (ResetQuery.user_id == user.doc_id)
        & (ResetQuery.used == False)
    )

    for token in other_tokens:
        reset_tokens.update(
            {
                "used": True
            },
            doc_ids=[token.doc_id],
        )

    return {
        "message": "Contraseña actualizada correctamente."
    }
