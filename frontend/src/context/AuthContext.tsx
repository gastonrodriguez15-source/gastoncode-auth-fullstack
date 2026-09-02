"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
} from "react";


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";


export type User = {
  id: number;
  email: string;
  name: string;
  phone: string;
  address: string;
};


type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated";


type AuthState = {
  user: User | null;
  token: string | null;
  status: AuthStatus;
};


type AuthAction =
  | {
      type: "LOADING";
    }
  | {
      type: "LOGIN_SUCCESS";
      payload: {
        user: User;
        token: string;
      };
    }
  | {
      type: "UPDATE_USER";
      payload: User;
    }
  | {
      type: "LOGOUT";
    };


const initialState: AuthState = {
  user: null,
  token: null,
  status: "loading",
};


function authReducer(
  state: AuthState,
  action: AuthAction
): AuthState {
  switch (action.type) {
    case "LOADING":
      return {
        ...state,
        status: "loading",
      };

    case "LOGIN_SUCCESS":
      return {
        user: action.payload.user,
        token: action.payload.token,
        status: "authenticated",
      };

    case "UPDATE_USER":
      return {
        ...state,
        user: action.payload,
      };

    case "LOGOUT":
      return {
        user: null,
        token: null,
        status: "unauthenticated",
      };

    default:
      return state;
  }
}


type AuthContextType = AuthState & {
  login: (
    email: string,
    password: string
  ) => Promise<void>;

  register: (
    email: string,
    password: string,
    name: string
  ) => Promise<void>;

  logout: () => void;

  refreshUser: () => Promise<void>;
};


const AuthContext =
  createContext<AuthContextType | null>(
    null
  );


export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(
    authReducer,
    initialState
  );


  async function login(
    email: string,
    password: string
  ) {
    dispatch({
      type: "LOADING",
    });

    const response = await fetch(
      `${API_URL}/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    if (!response.ok) {
      dispatch({
        type: "LOGOUT",
      });

      const data =
        await response
          .json()
          .catch(() => null);

      throw new Error(
        data?.detail ??
          "No se pudo iniciar sesión."
      );
    }

    const data = await response.json();

    localStorage.setItem(
      "token",
      data.access_token
    );

    dispatch({
      type: "LOGIN_SUCCESS",
      payload: {
        user: data.user,
        token: data.access_token,
      },
    });
  }


  async function register(
    email: string,
    password: string,
    name: string
  ) {
    const response = await fetch(
      `${API_URL}/auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          name,
          phone: "",
          address: "",
        }),
      }
    );

    if (!response.ok) {
      const data =
        await response
          .json()
          .catch(() => null);

      throw new Error(
        data?.detail ??
          "No se pudo registrar."
      );
    }

    await login(
      email,
      password
    );
  }


  function logout() {
    localStorage.removeItem(
      "token"
    );

    dispatch({
      type: "LOGOUT",
    });
  }


  async function refreshUser() {
    const token =
      localStorage.getItem("token");

    if (!token) {
      dispatch({
        type: "LOGOUT",
      });

      return;
    }

    const response = await fetch(
      `${API_URL}/auth/me`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      localStorage.removeItem(
        "token"
      );

      dispatch({
        type: "LOGOUT",
      });

      return;
    }

    const user =
      await response.json();

    dispatch({
      type: "LOGIN_SUCCESS",
      payload: {
        user,
        token,
      },
    });
  }


  useEffect(() => {
    async function hydrateAuth() {
      await refreshUser();
    }

    hydrateAuth();
  }, []);


  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth debe usarse dentro de AuthProvider"
    );
  }

  return context;
}
