import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "../lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function useAuth() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const register = async ({ email, password, displayName }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApi("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, displayName }),
      });
      localStorage.setItem("voyage-user", JSON.stringify(data.user));
      router.push("/?authenticated=1");
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const login = async ({ email, password }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("voyage-user", JSON.stringify(data.user));
      router.push("/?authenticated=1");
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const startOAuth = (provider) => {
    window.location.href = `${API_URL}/auth/${provider}/start`;
  };

  return {
    register,
    login,
    startOAuth,
    error,
    loading,
  };
}
