import { useState, useEffect } from "react";
import { api } from "../api-client.js";

interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem("ymail_token");
    if (!token) {
      setState({ user: null, token: null, loading: false });
      return;
    }

    api
      .get<User>("/me")
      .then((user) => setState({ user, token, loading: false }))
      .catch(() => {
        localStorage.removeItem("ymail_token");
        setState({ user: null, token: null, loading: false });
      });
  }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem("ymail_token", token);
    setState({ user, token, loading: false });
  };

  const logout = () => {
    localStorage.removeItem("ymail_token");
    setState({ user: null, token: null, loading: false });
  };

  return { ...state, login, logout };
}
