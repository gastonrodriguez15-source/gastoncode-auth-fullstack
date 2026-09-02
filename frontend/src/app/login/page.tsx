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


export default function LoginPage() {
  const router =
    useRouter();

  const {
    login,
  } = useAuth();

  const [email, setEmail] =
    useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [error, setError] =
    useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    resetSuccess,
    setResetSuccess,
  ] = useState(false);


  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    setResetSuccess(
      params.get("reset") ===
        "success"
    );
  }, []);


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(
        email,
        password
      );

      router.push(
        "/account/profile"
      );

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Error de login."
      );

    } finally {
      setLoading(false);
    }
  }


  return (
    <main>
      <h1>
        Iniciar sesión
      </h1>

      {resetSuccess && (
        <p>
          Contraseña actualizada.
          Ya puedes iniciar sesión.
        </p>
      )}

      <form
        onSubmit={handleSubmit}
      >
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
            required
          />
        </div>

        <button
          disabled={loading}
        >
          {loading
            ? "Entrando..."
            : "Entrar"}
        </button>
      </form>

      {error && (
        <p>{error}</p>
      )}

      <p>
        <a href="/forgot-password">
          ¿Olvidaste tu contraseña?
        </a>
      </p>

      <p>
        <a href="/register">
          Crear cuenta
        </a>
      </p>
    </main>
  );
}
