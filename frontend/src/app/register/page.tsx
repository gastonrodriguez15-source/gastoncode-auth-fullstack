"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useAuth,
} from "@/context/AuthContext";


export default function RegisterPage() {
  const router =
    useRouter();

  const {
    register,
  } = useAuth();

  const [email, setEmail] =
    useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [name, setName] =
    useState("");

  const [error, setError] =
    useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await register(
        email,
        password,
        name
      );

      router.push(
        "/account/profile"
      );

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Error al registrar."
      );

    } finally {
      setLoading(false);
    }
  }


  return (
    <main>
      <h1>
        Crear cuenta
      </h1>

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
            required
          />
        </div>

        <div>
          <label>
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            required
          />
        </div>

        <div>
          <label>
            Contraseña
          </label>

          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            minLength={8}
            required
          />
        </div>

        <button
          disabled={loading}
        >
          {loading
            ? "Creando..."
            : "Registrarme"}
        </button>
      </form>

      {error && (
        <p>{error}</p>
      )}

      <a href="/login">
        Ya tengo cuenta
      </a>
    </main>
  );
}
