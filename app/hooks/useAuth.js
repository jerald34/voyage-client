import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "../lib/api/index.js";

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
      return data.user;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createAgency = async (agencyData) => {
    setLoading(true);
    setError(null);
    try {
      await fetchApi("/agencies", {
        method: "POST",
        body: JSON.stringify(agencyData),
      });
      const meData = await fetchApi("/auth/me");
      localStorage.setItem("voyage-user", JSON.stringify(meData.user));
      router.push("/?authenticated=1");
      return meData.user;
    } catch (err) {
      setError(err);
      return null;
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

  const logout = async () => {
    setLoading(true);
    try {
      await fetchApi("/auth/logout", { method: "POST" }).catch(() => {});
    } finally {
      localStorage.removeItem("voyage-user");
      setLoading(false);
      window.location.href = "/";
    }
  };

  const startOAuth = (provider) => {
    window.location.href = `${API_URL}/auth/${provider}/start`;
  };

  return {
    register,
    createAgency,
    login,
    logout,
    startOAuth,
    error,
    setError,
    loading,
  };
}
