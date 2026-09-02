"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useAuth,
} from "@/context/AuthContext";


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";


export default function ProfilePage() {
  const router =
    useRouter();

  const {
    user,
    token,
    logout,
    refreshUser,
  } = useAuth();

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [
    address,
    setAddress,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const [error, setError] =
    useState("");


  useEffect(() => {
    if (!user) {
      return;
    }

    setName(user.name);
    setPhone(user.phone);
    setAddress(
      user.address
    );
  }, [user]);


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    const response = await fetch(
      `${API_URL}/profiles/me`,
      {
        method: "PUT",
        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          phone,
          address,
        }),
      }
    );


    if (
      response.status === 401
    ) {
      logout();

      router.push(
        "/login"
      );

      return;
    }


    if (!response.ok) {
      setError(
        "No se pudo actualizar el perfil."
      );

      return;
    }


    await refreshUser();

    setMessage(
      "Perfil actualizado."
    );
  }


  function handleLogout() {
    logout();

    router.push(
      "/login"
    );
  }


  return (
    <main>
      <h1>
        Mi perfil
      </h1>

      <p>
        Email:
        {" "}
        {user?.email}
      </p>

      <form
        onSubmit={handleSubmit}
      >
        <div>
          <label>
            Nombre
          </label>

          <input
            value={name}
            onChange={(event) =>
              setName(
                event.target.value
              )
            }
          />
        </div>

        <div>
          <label>
            Teléfono
          </label>

          <input
            value={phone}
            onChange={(event) =>
              setPhone(
                event.target.value
              )
            }
          />
        </div>

        <div>
          <label>
            Dirección
          </label>

          <input
            value={address}
            onChange={(event) =>
              setAddress(
                event.target.value
              )
            }
          />
        </div>

        <button>
          Guardar cambios
        </button>
      </form>

      {message && (
        <p>{message}</p>
      )}

      {error && (
        <p>{error}</p>
      )}

      <p>
        <a href="/account/change-password">
          Cambiar contraseña
        </a>
      </p>

      <button
        onClick={handleLogout}
      >
        Cerrar sesión
      </button>
    </main>
  );
}
